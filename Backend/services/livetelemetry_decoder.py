# file: livetelemetry_decoder.py
# Author: Blake Hill
# Desc: Helper functions for livetelemetry.py for decoding CAN data into JSON format

import os
import struct
from pathlib import Path

import cantools

from Backend.protobuf.proto.ava3_pb2 import Telemetry

DEFAULT_CAN_DBC_PATH = (
    Path(__file__).resolve().parents[1] / "candb" / "BYU_Racing_CAN.dbc"
)
CAN_DBC_PATH = Path(os.getenv("CAN_DBC_PATH", DEFAULT_CAN_DBC_PATH))
CAN_DB = cantools.database.load_file(str(CAN_DBC_PATH))

# Expected format of incoming data from Pi (17 bytes total):
PI_TO_SERVER_FMT = "<I I B 8s"
# <  = little-endian
# I  = uint32
# I  = uint32
# B  = uint8
# 8s = 8 raw bytes


# ========== Functions for decoding data ===========


def decode_can_dbc(decoded_packet) -> tuple:
    msg_id = decoded_packet["id"]
    msg_bytes = bytes(decoded_packet["bytes"][: decoded_packet["length"]])

    try:
        message = CAN_DB.get_message_by_frame_id(msg_id)
    except KeyError:
        print(f"Warning: No message found in DBC for ID {msg_id}")
        return None, {}

    signals = message.decode(
        msg_bytes,
        decode_choices=False,  # Keep raw values instead of mapping to enums
        scaling=True,  # Apply scaling and offsets from DBC
    )

    return message, signals


def convert_decoded_can_data(decoded_packet: dict) -> Telemetry:
    message, signals = decode_can_dbc(decoded_packet)
    if message is None:
        data = [float(value) for value in decoded_packet["bytes"]]
    else:
        data = [
            float(signals[signal.name])
            for signal in message.signals
            if signal.name in signals
        ]

    return Telemetry(
        type="telemetry",
        timestamp_ms=decoded_packet["timestamp"],
        id=decoded_packet["id"],
        data=data,
    )


# Decodes incoming raw bytes from Pi to a structured dict for JSON
def decode_pi_to_server(payload: bytes) -> dict:
    if len(payload) != 17:
        raise ValueError(f"Invalid payload length: {len(payload)}")

    timestamp, msg_id, length, raw_bytes = struct.unpack(PI_TO_SERVER_FMT, payload)

    # Convert raw_bytes (bytes object) → list[int]
    raw_data = list(raw_bytes[:length])

    return {"timestamp": timestamp, "id": msg_id, "length": length, "bytes": raw_data}
