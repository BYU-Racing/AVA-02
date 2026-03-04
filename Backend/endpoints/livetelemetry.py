# livetelemetry.py
# Author: Blake Hill
# Desc: Our live telemetry WebSocket endpoint, based off of telemetry.py (the one from Claude)
# Receives data from the Pi over /ws/send, decodes it, then sends to Frontend over /ws/livetelemetry and database

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import logging
import os
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from .. import crud, models, schemas
from ..services.livetelemetry_decoder import decode_pi_to_server, convert_decoded_can_data
from ..database import SessionLocal


# ========== Constants and Globals ===========

# Default values
DEFAULT_LIVE_DRIVER_ID : int = int(os.getenv("DEFAULT_LIVE_DRIVER_ID", "1"))
DEFAULT_LIVE_DRIVER_NAME : str = os.getenv("DEFAULT_LIVE_DRIVER_NAME", "Live Driver")
AUTO_DRIVE_NOTE : str = "Auto-created from live sender connection (/api/ws/send)"
UTC_PLUS_8 = timezone(timedelta(hours=8)) # UTC + 8 timezone

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ========== Connection manager class for websockets ===========

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


# ========== Functions for adding data to database ===========

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
    now = datetime.now(UTC_PLUS_8)

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


# ========== Websocket Handlers ===========

manager = ConnectionManager()

@router.websocket("/ws/livetelemetry") # handler for connecting to client for sending data to Frontend
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
    

@router.websocket("/ws/send") # handler for data from pi
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
