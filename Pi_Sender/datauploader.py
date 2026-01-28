#!/usr/bin/env python3
"""
WS test script to simulate live telemetry data
Sends bundled messages to /ws/send in the format:

{
  "time": int,
  "msg_id": [int, int, ...],
  "raw_data": [int, int, ...]   # flat byte list, 2 bytes per sensor in msg_id order
}

Requires: pip install websocket-client
"""

import json
import os
import random
import time
from typing import List, Dict, Any, Tuple

import websocket  # websocket-client

# =========================
# CONFIG
# =========================
# Use environment variable or default to production
WS_URL = os.getenv("WS_URL", "ws://ava-02.us-east-2.elasticbeanstalk.com/api/ws/send")
SEND_INTERVAL_SEC = 0.1
RECONNECT_DELAY_SEC = 2.0

# Encoding: 2 bytes per sensor value (unsigned 16-bit, big-endian)
BYTES_PER_SENSOR = 2


# =========================
# HELPERS
# =========================
def clamp(v: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, v))


def u16_to_bytes_be(x: int) -> List[int]:
    x = clamp(int(x), 0, 0xFFFF)
    return [(x >> 8) & 0xFF, x & 0xFF]


def pack_values_u16_be(values: List[int]) -> List[int]:
    raw: List[int] = []
    for v in values:
        raw.extend(u16_to_bytes_be(v))
    return raw


def make_bundle_message(sensor_ids: List[int], sensor_values: List[int]) -> Dict[str, Any]:
    if len(sensor_ids) != len(sensor_values):
        raise ValueError("sensor_ids and sensor_values must have the same length")

    return {
        "time": int(time.time() * 1000),  # ms epoch
        "msg_id": [int(x) for x in sensor_ids],
        "raw_data": pack_values_u16_be(sensor_values),
    }


class WSSender:
    def __init__(self, url: str):
        self.url = url
        self.ws = None

    def connect(self):
        while True:
            try:
                print(f"Connecting to {self.url} ...")
                self.ws = websocket.create_connection(self.url, timeout=5)
                print("✓ Connected to WS")
                return
            except Exception as e:
                print(f"✗ Connect failed (retrying): {e}")
                time.sleep(RECONNECT_DELAY_SEC)

    def send_obj(self, obj: Dict[str, Any]):
        if not self.ws:
            self.connect()
        try:
            self.ws.send(json.dumps(obj))
        except Exception as e:
            print(f"✗ Send failed, reconnecting: {e}")
            try:
                self.ws.close()
            except Exception:
                pass
            self.ws = None
            self.connect()
            self.ws.send(json.dumps(obj))

    def close(self):
        if self.ws:
            try:
                self.ws.close()
            except Exception:
                pass
        self.ws = None


# =========================
# SIMULATION LOGIC
# =========================
def simulate_realistic_driving(sender: WSSender):
    print("\n🏎️  Simulating realistic driving data over WS...")
    print("Bundling [throttle1, throttle2, brake, torque] into one message.")
    print("Press Ctrl+C to stop\n")

    throttle1 = 0
    throttle2 = 0
    brake = 0
    torque = 0

    sensor_ids = [1, 2, 3, 192]

    try:
        while True:
            action = random.choice(["accelerate", "coast", "brake"])

            if action == "accelerate":
                throttle1 += random.randint(10, 50)
                brake -= random.randint(0, 20)
                torque += random.randint(50, 200)
            elif action == "brake":
                throttle1 -= random.randint(20, 100)
                brake += random.randint(50, 200)
                torque -= random.randint(100, 300)
            else:
                throttle1 -= random.randint(0, 20)
                brake -= random.randint(0, 10)
                torque -= random.randint(0, 50)

            throttle1 = clamp(throttle1, 0, 1023)
            throttle2 = clamp(throttle1 + random.randint(-10, 10), 0, 1023)
            brake = clamp(brake, 0, 1023)
            torque = clamp(torque, 0, 2000)

            sensor_values = [throttle1, throttle2, brake, torque]
            msg = make_bundle_message(sensor_ids, sensor_values)

            sender.send_obj(msg)
            print(f"✓ Sent ids={sensor_ids} values={sensor_values} raw_len={len(msg['raw_data'])}")

            time.sleep(SEND_INTERVAL_SEC)

    except KeyboardInterrupt:
        print("\n\n✓ Simulation stopped")


def test_bundle(sender: WSSender):
    print("\n🧪 Sending one bundled test message...\n")
    ids = [0, 1, 2, 3, 192, 204]
    vals = [1, 512, 510, 256, 1500, 0]
    msg = make_bundle_message(ids, vals)
    sender.send_obj(msg)
    print(f"✓ Sent bundle ids={ids}")
    print(f"  raw_data={msg['raw_data']} (2 bytes per sensor)")


def send_custom_bundle(sender: WSSender):
    print("\nEnter a comma-separated list of sensor IDs, e.g. 1,2,3,192")
    ids_str = input("msg_id list: ").strip()
    ids = [int(x.strip()) for x in ids_str.split(",") if x.strip()]

    print("Enter the same number of values, e.g. 100,101,0,500")
    vals_str = input("values list: ").strip()
    vals = [int(x.strip()) for x in vals_str.split(",") if x.strip()]

    msg = make_bundle_message(ids, vals)
    sender.send_obj(msg)
    print(f"✓ Sent bundle ids={ids} values={vals}")


def main():
    print("=" * 60)
    print("AVA-02 Telemetry WS Bundle Test Script (/ws/send)")
    print("=" * 60)
    print("\nPayload format:")
    print('  {"time": <int>, "msg_id": [..], "raw_data": [..]}')
    print(f"Encoding: {BYTES_PER_SENSOR} bytes per sensor (u16 big-endian)\n")
    print("Requires: pip install websocket-client\n")

    sender = WSSender(WS_URL)
    sender.connect()

    try:
        while True:
            print("\nOptions:")
            print("1. Simulate realistic driving (continuous, bundled)")
            print("2. Send one bundled test message")
            print("3. Send custom bundled message")
            print("4. Exit")

            choice = input("\nEnter choice (1-4): ").strip()

            if choice == "1":
                simulate_realistic_driving(sender)
            elif choice == "2":
                test_bundle(sender)
            elif choice == "3":
                send_custom_bundle(sender)
            elif choice == "4":
                print("\n👋 Goodbye!")
                break
            else:
                print("Invalid choice. Try again.")

    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    finally:
        sender.close()


if __name__ == "__main__":
    main()
