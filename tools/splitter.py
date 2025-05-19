#!/usr/bin/env python3

from pathlib import Path
import json
import re
import shutil
from tqdm import tqdm

here = Path(__file__).parent
export = here / "ARK (28-2-2025)"

out = here / "splitter"
shutil.rmtree(out, ignore_errors=True)
out.mkdir(parents=True)

for f in list(export.glob("*.json")):
    size = f.stat().st_size
    if size <= 20_000_000:
        continue

    print(f)

    with f.open("r") as fp:
        data = json.load(fp)

    assert data["messageCount"] == len(data["messages"])
    msgs = data["messages"]

    # split into approximately 10M chunks
    chunks = size // 10_000_000 + 1
    per_chunk = len(msgs) // chunks + 1

    for i, offset in enumerate(range(0, len(msgs), per_chunk), 1):
        chunk = msgs[offset:offset + per_chunk]

        data_chunk = {
            "guild": data["guild"],
            "channel": data["channel"],
            "messages": chunk,
            "messageCount": len(chunk),
        }

        out_name = f.name
        if i > 1:
            out_name = f"{f.stem} [part {i}].json"

        with (out / out_name).open("w") as fd:
            print(" ->", out_name)
            json.dump(data_chunk, fd, indent=2)
