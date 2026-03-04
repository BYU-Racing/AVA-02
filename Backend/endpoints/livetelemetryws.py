# Our live telemetry WebSocket endpoint, based off of telemetry.py (the one from Claude)
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import logging
import os
import struct
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from .. import crud, models, schemas
from ..database import SessionLocal

# Expected format of incoming data from Pi (14 bytes total):
PI_TO_SERVER_FMT = "<I B B 8s"
# <  = little-endian
# I  = uint32
# B  = uint8
# B  = uint8
# 8s = 8 raw bytes

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_LIVE_DRIVER_ID = int(os.getenv("DEFAULT_LIVE_DRIVER_ID", "1"))
DEFAULT_LIVE_DRIVER_NAME = os.getenv("DEFAULT_LIVE_DRIVER_NAME", "Live Driver")
AUTO_DRIVE_NOTE = "Auto-created from live sender connection (/api/ws/send)"

# Connection manager class for websockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        
    async def connect(self, websocket: WebSocket, client = True):
        await websocket.accept()
        if client:
            self.active_connections.append(websocket)
            logger.info(f"New client connection established. Total clients: {len(self.active_connections)}")
        if not client:
            await self.broadcast({
                "type": "connection",
                "status": "connected",
                "timestamp": datetime.now().isoformat(),
                "message": "Connected to sender WebSocket!"
            })
        
        
    async def disconnect(self, websocket: WebSocket, client = True):
        if client:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
                logger.info(f"Connection closed. Total clients: {len(self.active_connections)}")
        else:
            logger.info("Sender disconnected (/ws/send)")
            await self.broadcast({
                "type": "connection",
                "status": "disconnected",
                "timestamp": datetime.now().isoformat(),
                "message": "Sender disconnected from WebSocket"
            })
    
    async def broadcast(self, message: Dict):
        disconnected: List[WebSocket] = []

        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to client: {e}")
                disconnected.append(conn)

        # Clean up dead connections
        for conn in disconnected:
            await self.disconnect(conn)

manager = ConnectionManager()

# Functions for adding data to database
def normalize_raw_data(raw_data: List[int]) -> List[int]:
    # Analysis pipeline expects 8-byte payload-style arrays.
    return (raw_data + [0] * 8)[:8]

def get_or_create_default_driver_id(db: Session) -> int:
    driver = crud.get_driver(db, DEFAULT_LIVE_DRIVER_ID)
    if driver is not None:
        return driver.driver_id

    try:
        default_driver = models.Driver(
            driver_id=DEFAULT_LIVE_DRIVER_ID,
            name=DEFAULT_LIVE_DRIVER_NAME
        )
        db.add(default_driver)
        db.commit()
        db.refresh(default_driver)
        logger.info(
            "Created default live telemetry driver with id=%s",
            default_driver.driver_id
        )
        return default_driver.driver_id
    except Exception as exc:
        db.rollback()
        logger.warning(
            "Could not create default driver id=%s (%s). Falling back.",
            DEFAULT_LIVE_DRIVER_ID,
            exc
        )

    existing_by_name = crud.get_driver_by_name(db, DEFAULT_LIVE_DRIVER_NAME)
    if existing_by_name is not None:
        return existing_by_name.driver_id

    fallback_driver = crud.create_driver(
        db=db,
        user=schemas.DriverCreate(name=DEFAULT_LIVE_DRIVER_NAME)
    )
    logger.warning(
        "Using fallback live telemetry driver id=%s",
        fallback_driver.driver_id
    )
    return fallback_driver.driver_id

def create_live_drive(db: Session) -> models.Drive:
    driver_id = get_or_create_default_driver_id(db)
    now = datetime.utcnow()

    drive = schemas.DriveCreate(
        driver_id=driver_id,
        date=now,
        notes=AUTO_DRIVE_NOTE,
        hash=f"live-{uuid.uuid4().hex}"
    )
    return crud.create_drive(db=db, drive=drive)

def persist_live_packet(db: Session, drive_id: int, decoded_packet: Dict):
    db_row = models.RawData(
        drive_id=drive_id,
        msg_id=decoded_packet["id"],
        raw_data=normalize_raw_data(decoded_packet["bytes"]),
        time=decoded_packet["timestamp"]
    )
    db.add(db_row)
    db.commit()

# Decodes incoming raw bytes from Pi to a structured dict for JSON
def decode_pi_to_server(payload: bytes) -> Dict:
    if len(payload) != 14:
        raise ValueError(f"Invalid payload length: {len(payload)}")

    
    timestamp, msg_id, length, raw_bytes = struct.unpack(
        PI_TO_SERVER_FMT, payload
    )

    # Convert raw_bytes (bytes object) → list[int]
    raw_data = list(raw_bytes[:length])
    

    return {
        "timestamp": timestamp,
        "id": msg_id,
        "length": length,
        "bytes": raw_data
    }

# uint16 little-endian decoder (for 2-byte sensor values)
def decode_u16_le(b: List[int], off: int = 0) -> int:
    if off + 1 >= len(b):
        return 0
    return b[off] | (b[off + 1] << 8)

def decode_i32_le(b: List[int], off: int) -> int:
    return int.from_bytes(bytes(b[off:off+4]), byteorder='little', signed=True)

def decode_u32_le(b: List[int], off: int) -> int:
    return int.from_bytes(bytes(b[off:off+4]), byteorder='little', signed=False)

# Converts the decoded CAN data into expected JSON format for Frontend
def convert_can_data(data: bytes) -> Dict:
    return convert_decoded_can_data(decode_pi_to_server(data))

def convert_decoded_can_data(decoded: Dict) -> Dict:
    '''Convert incoming CAN data to AVA usable format
    Incoming data:
    {
        timestamp: int,
        id: int,
        length: int, // up to 8
        bytes: List[int], // length: up to 8
    }
    Output format expected by the new React component:
    {
      type: "telemetry",
      timestamp: "<iso8601>",
      id: <int 0-255>,
      data: "<integer as string>" OR ["<...>", "<...>"]
    }
    '''
    msg_id = decoded["id"]
    b = decoded["bytes"] 
    
    match(msg_id):
        case 0: # StartSwitch
            data = [b[0] if b else 0]
        case 1 | 2 | 3: # Throttle1, Throttle2, Brake
            data = [decode_u16_le(b, 0) if len(b) >= 2 else 0]
        case 4: # Acceleration and Rotation
            data = [b[0] if b else 0, decode_i32_le(b, 1) if len(b) >= 5 else 0]
        case 5: # Tire RPM (uint8 tire, uint32 rpm)
            data = [b[0] if b else 0, decode_u32_le(b, 1) if len(b) >= 5 else 0]
        case 6: # Tire heat sensor (uint8 tire, uint16 inner_temp, uint16 outer_temp, uint16 core_temp)
            inner = decode_u16_le(b, 1) if len(b) >= 3 else 0
            outer = decode_u16_le(b, 3) if len(b) >= 5 else 0
            core = decode_u16_le(b, 5) if len(b) >= 7 else 0
            data = [b[0] if b else 0, inner, outer, core]
        case 7: # BMS percentage (0-100)
            data = [b[0] if b else 0]
        case 8: # BMS temperature (uint16 temp)
            data = [decode_u16_le(b, 0) if len(b) >= 2 else 0]
        case 9: # GPS (uint16 lat, uint16 long)
            data = [decode_i32_le(b, 0) if len(b) >= 4 else 0, decode_i32_le(b, 4) if len(b) >= 8 else 0]
        case 10: # Lap Number  ( soon to be time as well uint32 ms)
            # data = [b[0] if b else 0, decode_u32_le(b, 1) if len(b) >= 5 else 0]
            data = [b[0] if b else 0]
        case _: # Unknown / ghost IDs
            # Keep it visible in the feed but don't affect known sensors
            # Send raw bytes as hex strings (easy to read) OR as ints
            data = [f"0x{x:02X}" for x in b]  # readable

    return {
        "type": "telemetry",
        "timestamp": decoded["timestamp"],
        "id": msg_id,
        "data": data
    }


@router.websocket("/ws/livetelemetry") # send to client
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    logger.info("Client connected to live telemetry WebSocket")
    try:
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "timestamp": datetime.now().isoformat(),
            "message": "Connected to live telemetry WebSocket"
        })
        
        while True:
            # For testing
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"LiveTelemetry webSocket error: {e}")
    except:
        await manager.disconnect(websocket)
    

@router.websocket("/ws/send") # receive from pi
async def websocket_sendpoint(websocket: WebSocket):
    '''WS handler for data sent from pi'''
    await manager.connect(websocket, client=False)
    logger.info("Pi connected to send telemetry WebSocket")
    db = SessionLocal()
    live_drive = None
    packets_written = 0
    
    try:
        live_drive = create_live_drive(db)
        logger.info(
            "Live telemetry drive started: drive_id=%s driver_id=%s",
            live_drive.drive_id,
            live_drive.driver_id
        )

        await manager.broadcast({
            "type": "drive",
            "status": "started",
            "timestamp": datetime.now().isoformat(),
            "drive_id": live_drive.drive_id,
            "driver_id": live_drive.driver_id
        })

        while True: # Receive and parse data from pi
            data = await websocket.receive_bytes()
            decoded_packet = decode_pi_to_server(data)
            persist_live_packet(db, live_drive.drive_id, decoded_packet)
            packets_written += 1

            sensor_data = convert_decoded_can_data(decoded_packet)
            await manager.broadcast(sensor_data)
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        db.rollback()
        logger.error(f"SendTelemetry webSocket error: {e}")
    finally:
        await manager.disconnect(websocket, client=False)
        db.close()
        if live_drive is not None:
            logger.info(
                "Pi disconnected from send telemetry WebSocket. Closed drive_id=%s packets_written=%s",
                live_drive.drive_id,
                packets_written
            )
        else:
            logger.info("Pi disconnected from send telemetry WebSocket before drive creation")
