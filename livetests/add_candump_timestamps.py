#!/usr/bin/env python3
"""Convert the untimestamped, spaced CAN test dumps to candump -L style logs.

The generated timestamps are synthetic Unix epoch timestamps. They preserve
frame order and add random positive gaps; they are not recovered capture times.

Usage:
    python3 livetests/add_candump_timestamps.py livetests/livetest.log

By default this writes livetest.timestamped.log beside the input and leaves the
source file untouched.
"""

import argparse
import random
import re
import time
from pathlib import Path


FRAME_RE = re.compile(
    r"^\s*(\S+)\s+([0-9A-Fa-f]{1,8})\s+\[(\d+)\]\s*(.*?)\s*$"
)


def parse_frame(line: str, line_number: int) -> tuple[str, str, str]:
    match = FRAME_RE.match(line)
    if not match:
        raise ValueError(f"line {line_number}: not a spaced CAN frame: {line!r}")

    interface, can_id, dlc_text, data_text = match.groups()
    dlc = int(dlc_text)
    data_bytes = data_text.split() if data_text else []
    if len(data_bytes) != dlc:
        raise ValueError(
            f"line {line_number}: declared [{dlc}] bytes but found {len(data_bytes)}"
        )
    if any(not re.fullmatch(r"[0-9A-Fa-f]{2}", byte) for byte in data_bytes):
        raise ValueError(f"line {line_number}: data bytes must be two-digit hex")

    return interface, can_id.upper(), "".join(byte.upper() for byte in data_bytes)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="untimestamped spaced CAN dump")
    parser.add_argument(
        "-o", "--output", type=Path,
        help="output path (default: <input stem>.timestamped.log)",
    )
    parser.add_argument(
        "--seed", type=int,
        help="seed the random gaps to make generated timestamps repeatable",
    )
    parser.add_argument(
        "--min-gap-us", type=int, default=100,
        help="minimum gap between frames in microseconds (default: 100)",
    )
    parser.add_argument(
        "--max-gap-us", type=int, default=20_000,
        help="maximum gap between frames in microseconds (default: 20000)",
    )
    parser.add_argument(
        "--start-epoch-us", type=int, default=None,
        help="synthetic Unix epoch start time in microseconds (default: now)",
    )
    args = parser.parse_args()

    if args.min_gap_us < 1 or args.max_gap_us < args.min_gap_us:
        parser.error("gap values must satisfy 1 <= min-gap-us <= max-gap-us")
    if not args.input.is_file():
        parser.error(f"input file does not exist: {args.input}")

    output = args.output or args.input.with_name(
        f"{args.input.stem}.timestamped.log"
    )
    if output.resolve() == args.input.resolve():
        parser.error("output must differ from input; source files are kept intact")

    rng = random.Random(args.seed)
    timestamp_us = (
        args.start_epoch_us
        if args.start_epoch_us is not None
        else time.time_ns() // 1_000
    )
    frames_written = 0

    with args.input.open("r", encoding="ascii") as source, output.open(
        "w", encoding="ascii", newline="\n"
    ) as destination:
        for line_number, line in enumerate(source, start=1):
            if not line.strip():
                continue
            interface, can_id, payload = parse_frame(line, line_number)
            if frames_written:
                timestamp_us += rng.randint(args.min_gap_us, args.max_gap_us)

            seconds, microseconds = divmod(timestamp_us, 1_000_000)
            # candump -L log style: (absolute timestamp) interface CAN-ID#payload
            destination.write(
                f"({seconds:010d}.{microseconds:06d}) "
                f"{interface} {can_id}#{payload}\n"
            )
            frames_written += 1

    print(f"Wrote {frames_written:,} timestamped frames to {output}")
    print("Timestamps are synthetic and must not be treated as measured capture time.")


if __name__ == "__main__":
    main()
