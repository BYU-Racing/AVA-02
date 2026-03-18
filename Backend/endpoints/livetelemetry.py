# File: livetelemetry.py
# Author: Blake Hill
# Desc: Our live telemetry WebSocket endpoint, based off of telemetry.py (the one from Claude)
# Receives data from the Pi over /ws/send, decodes it, then sends to Frontend over /ws/livetelemetry and database

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional
import logging
import asyncio
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
                "timestamp": datetime.now(timezone.utc).isoformat(),
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
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": "Sender disconnected from WebSocket"
            })
    
    # Sends message to all connected clients. If a client is disconnected, removes it from the list.
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

# Reconnect state
_pi_live_drive: Optional[models.Drive] = None
_pi_db: Optional[Session] = None
_pi_packets_written: int = 0
_pi_reconnect_task: Optional[asyncio.Task] = None
RECONNECT_TIMEOUT_SEC = 5

_database_enabled: bool = True


def get_database_state_payload() -> Dict:
    return {
        "type": "database",
        "database_enabled": _database_enabled,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def broadcast_database_state():
    await manager.broadcast(get_database_state_payload())


def update_database_enabled(enabled: bool) -> bool:
    global _database_enabled
    _database_enabled = enabled
    logger.info("Database persistence state changed to: %s", _database_enabled)
    return _database_enabled


def reset_pi_state(close_db: bool = False):
    global _pi_db, _pi_live_drive, _pi_packets_written, _pi_reconnect_task

    if close_db and _pi_db is not None:
        try:
            _pi_db.close()
        except Exception as exc:
            logger.warning("Error closing live telemetry DB session: %s", exc)

    _pi_db = None
    _pi_live_drive = None
    _pi_packets_written = 0
    _pi_reconnect_task = None


@router.get("/livetelemetry/db")
def get_live_db_state():
    return get_database_state_payload()


@router.post("/livetelemetry/db")
async def set_live_db_state(enabled: bool = Query(...)):
    update_database_enabled(enabled)
    await broadcast_database_state()
    return get_database_state_payload()

@router.websocket("/ws/livetelemetry") # handler for connecting to client for sending data to Frontend
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    logger.info("Client connected to live telemetry WebSocket")
    try:
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": "Connected to live telemetry WebSocket"
        })
        await websocket.send_json(get_database_state_payload())
        
        while True:
            # For testing
            msg = await websocket.receive_json()
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
            # "type": "db",
            # "enabled": bool",
            # "timestamp": datetime.now(timezone.utc).isoformat()
            # Turns on and off database persistence based on button
            elif msg.get("type") in {"db", "database"}:
                enabled = msg.get("database_enabled", msg.get("enabled"))
                if isinstance(enabled, bool):
                    update_database_enabled(enabled)
                await websocket.send_json(get_database_state_payload())
                await broadcast_database_state()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"LiveTelemetry webSocket error: {e}")
    finally:
        await manager.disconnect(websocket)
    

@router.websocket("/ws/send") # handler for data from pi
async def websocket_sendpoint(websocket: WebSocket):
    '''WS handler for data sent from pi'''
    global _pi_live_drive, _pi_db, _pi_packets_written, _pi_reconnect_task
    await manager.connect(websocket, client=False)
    logger.info("Pi connected to send telemetry WebSocket")

    db: Optional[Session] = None
    live_drive: Optional[models.Drive] = None

    if (
        _pi_reconnect_task
        and not _pi_reconnect_task.done()
        and _pi_db is not None
        and _pi_live_drive is not None
    ):
        _pi_reconnect_task.cancel()
        _pi_reconnect_task = None
        logger.info("Pi reconnected within window, resuming drive_id=%s", _pi_live_drive.drive_id)
        db, live_drive = _pi_db, _pi_live_drive
    else:
        db = SessionLocal()
        try:
            live_drive = create_live_drive(db)
            logger.info(
                "Live telemetry drive started: drive_id=%s driver_id=%s",
                live_drive.drive_id,
                live_drive.driver_id
            )
        except Exception as e:
            logger.error(f"Error creating live drive: {e}")
            db.close()
            db = None
            live_drive = None

        _pi_db, _pi_live_drive, _pi_packets_written = db, live_drive, 0

    if live_drive is not None:
        await manager.broadcast({
            "type": "drive",
            "status": "started",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "drive_id": live_drive.drive_id,
            "driver_id": live_drive.driver_id
        })
    
    try:
        while True: # Receive and parse data from pi
            data = await websocket.receive_bytes()
            decoded_packet = decode_pi_to_server(data)

            if _database_enabled:
                if db is None or live_drive is None:
                    db = SessionLocal()
                    try:
                        live_drive = create_live_drive(db)
                        _pi_db, _pi_live_drive, _pi_packets_written = db, live_drive, 0
                        await manager.broadcast({
                            "type": "drive",
                            "status": "started",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "drive_id": live_drive.drive_id,
                            "driver_id": live_drive.driver_id
                        })
                    except Exception as exc:
                        logger.error("Could not create live drive while persisting telemetry: %s", exc)
                        db.close()
                        db = None
                        live_drive = None
                        _pi_db, _pi_live_drive = None, None

                if db is not None and live_drive is not None:
                    try:
                        persist_live_packet(db, live_drive.drive_id, decoded_packet)
                        _pi_packets_written += 1
                    except Exception as exc:
                        db.rollback()
                        logger.error(
                            "Failed to persist live telemetry packet for drive_id=%s: %s",
                            live_drive.drive_id,
                            exc
                        )

            sensor_data = convert_decoded_can_data(decoded_packet)
            await manager.broadcast(sensor_data)
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        if db is not None:
            db.rollback()
        logger.error(f"SendTelemetry webSocket error: {e}")
    finally:
        await manager.disconnect(websocket, client=False)
        if db is None or live_drive is None:
            reset_pi_state(close_db=True)
            return

        logger.info("Pi disconnecting, attempting to reconnect within %ss", RECONNECT_TIMEOUT_SEC)

        async def wait_for_reconnect(drive_id: int):
            try:
                await asyncio.sleep(RECONNECT_TIMEOUT_SEC)
                logger.info(
                    "Reconnect timer expired, closing drive_id=%s with %s packets written",
                    drive_id,
                    _pi_packets_written
                )
                reset_pi_state(close_db=True)
            except asyncio.CancelledError:
                logger.info("Reconnect timer cancelled for drive_id=%s", drive_id)
                raise

        _pi_reconnect_task = asyncio.create_task(wait_for_reconnect(live_drive.drive_id))
