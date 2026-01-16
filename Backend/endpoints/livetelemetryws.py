# Our live telemetry WebSocket endpoint, based off of telemetry.py (the one from Claude)
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
        self.connection_count = 0
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_count += 1
        logger.info(f"New connection established. Total connections: {self.connection_count}")
        
    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            self.connection_count -= 1
            logger.info(f"Connection closed. Total connections: {self.connection_count}")
    
