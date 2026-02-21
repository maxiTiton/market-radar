import json
import math
import os


def clean_nan(obj):
    """Reemplaza NaN e Infinity por None recursivamente."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_nan(v) for v in obj]
    return obj


def save_json(period, data):
    os.makedirs("data/output", exist_ok=True)
    path = f"data/output/{period}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(clean_nan(data), f, indent=2, ensure_ascii=False)