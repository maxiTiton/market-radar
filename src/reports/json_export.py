import json
import os


def save_json(period, data):
    os.makedirs("data/output", exist_ok=True)

    path = f"data/output/{period}.json"

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
