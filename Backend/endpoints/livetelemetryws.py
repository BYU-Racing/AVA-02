# Our live telemetry WebSocket endpoint, based off of telemetry.py (the one from Claude)
#TODO: receive CAN-style data instead of AVA-style data, then convert it
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import logging
import struct
from datetime import datetime
from typing import Dict

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

def convert_data(data: Dict) -> Dict:
    '''Convert incoming data for AVA; currently just adds a timestamp'''
    sensor_data = {
        "type": "telemetry",
        "time": data.get("time", 0),
        "msg_id": data.get("msg_id", []),
        "raw_data": data.get("raw_data", []),
        "timestamp": datetime.now().isoformat()
    }
    return sensor_data

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

def decode_u16_le(bytes: List[int]) -> int:
    return (bytes[1] << 8) | bytes[0]

def convert_can_data(data: bytes) -> Dict:
    '''Convert incoming CAN data to AVA usable format
    Incoming data:
    {
        timestamp: int,
        id: int,
        length: int, // up to 8
        bytes: List[int], // length: up to 8
    }
    AVA Data format:
    {
        type: string, // "telemetry"
        time: int,
        msg_id: List[int], // sensor values
        raw_data: List[int] // raw sensor data
    }
    '''
    decoded = decode_pi_to_server(data)
    raw_data = int.from_bytes(bytes(decoded["bytes"]), byteorder='little', signed=False)
    
    return {
        "type": "telemetry",
        "time": decoded["timestamp"],
        "msg_id": [decoded["id"]],
        "raw_data": [raw_data]
    }

@router.websocket("/ws/livetelemetry") # send to client
async def websocket_endpoint(websocket: WebSocket):
    '''WS handler for sending live telemetry data to clients
    AVA Data format:
    {
        time: int, // primary value
        msg_id: List[int], // sensor values
        raw_data: List[int] // raw sensor data
    }
    '''
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
            # Broadcast received data to all connected clients
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
            # if not isinstance(data, dict):
            #     logger.error("Invalid data format received from Pi")
            #     continue
            
            sensor_data = convert_can_data(data)
            await manager.broadcast(sensor_data)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"SendTelemetry webSocket error: {e}")
    finally:
        logger.info("Pi disconnected from send telemetry WebSocket")