#!/usr/bin/env python3

from pathlib import Path
import json
import re
import collections
from tqdm import tqdm

here = Path(__file__).parent
export = here / "out"

STEM_PATTERN = re.compile(r"(.*) - (.*) - (.*) \[(\d+)\]( \[part (\d+)\])?")

index = collections.OrderedDict()

for f in tqdm(list(export.glob("*.json"))):
    m = STEM_PATTERN.fullmatch(f.stem)
    if not m:
        raise ValueError(f"Invalid filename: {f.stem}")

    guild, category, channel, chan_id, _, part = m.groups()
    part = int(part) if part else 1

    with f.open("r") as fp:
        data = json.load(fp)
        index[f.name] = {
            "guild": data["guild"],
            "channel": data["channel"],
            "first_message_id": data["messages"][0]["id"],
            "last_message_id": data["messages"][-1]["id"],
        }

print(json.dumps(index, indent="\t"))
