# Our live telemetry WebSocket endpoint, based off of telemetry.py (the one from Claude)
#TODO: receive CAN-style data instead of AVA-style data, then convert it
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import logging
from datetime import datetime

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
    '''Convert incoming data from CAN to JSON for AVA'''
    sensor_data = {
        "type": "telemetry",
        "time": data.get("time", 0),
        "msg_id": data.get("msg_id", []),
        "raw_data": data.get("raw_data", []),
        "timestamp": datetime.now().isoformat()
    }
    return sensor_data

def decode_to_u16(b0: int, b1: int) -> int:
    return (b0 << 8) | b1

#TODO: data conversion from CAN to AVA format
def convert_data_from_can(data: Dict) -> Dict:
    '''Convert incoming data from CAN to JSON for AVA'''
    msg_ids = data.get("msg_id", [])
    raw_data_bytes = data.get("raw_data", [])
    
    if(len(msg_ids) != 4):
        logger.error("Invalid msg_id length received from Pi")
        return {}
    if(len(raw_data_bytes) != 8):
        logger.error("Invalid raw_data length received from Pi")
        return {}
    
    raw_data = []
    for i in range(4):
        raw_data = decode_to_u16(raw_data_bytes[i*2], raw_data_bytes[(i*2)+1])

    sensor_data = {
        "type": "telemetry",
        "time": data.get("time", 0),
        "msg_id": data.get("msg_id", []),
        "raw_data": raw_data,
        "timestamp": datetime.now().isoformat()
    }
    return sensor_data

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
            data = await websocket.receive_json()
            if not isinstance(data, dict):
                logger.error("Invalid data format received from Pi")
                continue
            
            sensor_data = convert_data(data)
            await manager.broadcast(sensor_data)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"SendTelemetry webSocket error: {e}")
    finally:
        logger.info("Pi disconnected from send telemetry WebSocket")