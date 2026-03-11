# file: livetelemetry_decoder.py
# Author: Blake Hill
# Desc: Helper functions for livetelemetry.py for decoding CAN data into JSON format

from typing import List, Dict
import struct

# Expected format of incoming data from Pi (14 bytes total):
PI_TO_SERVER_FMT = "<I B B 8s"
# <  = little-endian
# I  = uint32
# B  = uint8
# B  = uint8
# 8s = 8 raw bytes


# ========== Functions for decoding data ===========

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
    
    if msg_id == 0: # StartSwitch
        data = [b[0] if b else 0]
    elif msg_id in [1, 2, 3]: # Throttle1, Throttle2, Brake
        data = [decode_u16_le(b, 0) if len(b) >= 2 else 0]
    elif msg_id == 4: # Acceleration and Rotation
        data = [b[0] if b else 0, decode_i32_le(b, 1) if len(b) >= 5 else 0]
    elif msg_id == 5: # Tire RPM (uint8 tire, uint32 rpm)
        data = [b[0] if b else 0, decode_u32_le(b, 1) if len(b) >= 5 else 0]
    elif msg_id == 6: # Tire heat sensor (uint8 tire, uint16 inner_temp, uint16 outer_temp, uint16 core_temp)
        inner = decode_u16_le(b, 1) if len(b) >= 3 else 0
        outer = decode_u16_le(b, 3) if len(b) >= 5 else 0
        core = decode_u16_le(b, 5) if len(b) >= 7 else 0
        data = [b[0] if b else 0, inner, outer, core]
    elif msg_id == 7: # BMS percentage (0-100)
        data = [b[0] if b else 0]
    elif msg_id == 8: # BMS temperature (uint16 temp)
        data = [decode_u16_le(b, 0) if len(b) >= 2 else 0]
    elif msg_id == 9: # GPS (uint16 lat, uint16 long)
        data = [decode_i32_le(b, 0) if len(b) >= 4 else 0, decode_i32_le(b, 4) if len(b) >= 8 else 0]
    elif msg_id == 10: # Lap Number  ( soon to be time as well uint32 ms)
        # data = [b[0] if b else 0, decode_u32_le(b, 1) if len(b) >= 5 else 0]
        data = [b[0] if b else 0]
    else: # Unknown / ghost IDs
        # Keep it visible in the feed but don't affect known sensors
        # Send raw bytes as hex strings (easy to read) OR as ints
        data = [f"0x{x:02X}" for x in b]  # readable

    return {
        "type": "telemetry",
        "timestamp": decoded["timestamp"],
        "id": msg_id,
        "data": data
    }