# Our live telemetry WebSocket endpoint, based off of telemetry.py (the one from Claude)
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import logging
import struct
from datetime import datetime
from typing import Dict

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

# Connection manager class for websockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        
    async def connect(self, websocket: WebSocket, client = True):
        await websocket.accept()
        if client:
            self.active_connections.append(websocket)
        logger.info(f"New connection established. Total clients: {len(self.active_connections)}")
        
    async def disconnect(self, websocket: WebSocket, client = True):
        if client:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
                logger.info(f"Connection closed. Total clients: {len(self.active_connections)}")
        else:
            logger.info("Sender disconnected (/ws/send)")
    
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
    decoded = decode_pi_to_server(data)
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
    
    try:
        while True: # Receive and parse data from pi
            data = await websocket.receive_bytes()
            sensor_data = convert_can_data(data)
            await manager.broadcast(sensor_data)
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"SendTelemetry webSocket error: {e}")
    finally:
        logger.info("Pi disconnected from send telemetry WebSocket")