from fastapi import APIRouter
import json
from pathlib import Path

router = APIRouter()

BASE_PATH = Path("data/output")


def load_json(filename: str):
    path = BASE_PATH / filename
    if not path.exists():
        return {"error": f"{filename} not found"}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/daily")
def daily_market():
    return load_json("daily.json")


@router.get("/weekly")
def weekly_market():
    return load_json("weekly.json")


@router.get("/monthly")
def monthly_market():
    return load_json("monthly.json")


@router.get("/all")
def all_assets():
    return load_json("all_assets.json")