# Our live telemetry WebSocket endpoint, based off of telemetry.py (the one from Claude)
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import logging
from datetime import datetime

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_count = 0
        