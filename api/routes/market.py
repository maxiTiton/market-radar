import os
import math
import requests
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
import json
from pathlib import Path

router = APIRouter()
BASE_PATH = Path("data/output")
FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY", "")
FINNHUB_BASE = "https://finnhub.io/api/v1"


def load_json(filename: str):
    path = BASE_PATH / filename
    if not path.exists():
        return {"error": f"{filename} not found"}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def finnhub_candles(symbol: str, period: str) -> list:
    end = datetime.now()
    days = {"1mo": 35, "3mo": 95, "6mo": 185, "1y": 370}.get(period, 95)
    start = end - timedelta(days=days)

    finnhub_symbol = symbol.replace(".BA", "")
    resp = requests.get(
        f"{FINNHUB_BASE}/stock/candle",
        params={
            "symbol": finnhub_symbol,
            "resolution": "D",
            "from": int(start.timestamp()),
            "to": int(end.timestamp()),
            "token": FINNHUB_API_KEY,
        },
        timeout=10
    )
    resp.raise_for_status()
    data = resp.json()

    if data.get("s") != "ok" or not data.get("c"):
        raise ValueError(f"No data: {data.get('s')}")

    history = []
    for ts, price in zip(data["t"], data["c"]):
        if not math.isnan(price):
            history.append({
                "date": datetime.fromtimestamp(ts).strftime("%Y-%m-%d"),
                "price": round(float(price), 4)
            })
    return history


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


@router.get("/asset/{symbol}")
def asset_detail(symbol: str, period: str = "3mo"):
    allowed = ["1mo", "3mo", "6mo", "1y"]
    if period not in allowed:
        period = "3mo"

    try:
        history = finnhub_candles(symbol, period)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    if len(history) < 2:
        raise HTTPException(status_code=404, detail=f"Insufficient data for {symbol}")

    current = history[-1]["price"]
    prev = history[-2]["price"]
    high = max(h["price"] for h in history)
    low = min(h["price"] for h in history)
    daily_return = round((current / prev - 1) * 100, 2)

    all_data = load_json("all_assets.json")
    sector = "Unknown"
    asset_returns = None
    for a in all_data.get("assets", []):
        if a["symbol"].upper() == symbol.upper():
            sector = a["sector"]
            asset_returns = a["returns"]
            break

    daily_data = load_json("daily.json")
    sector_avg = None
    for s in daily_data.get("sector_ranking", []):
        if s["sector"] == sector:
            sector_avg = s["avg_return"]
            break

    return {
        "symbol": symbol.upper(),
        "sector": sector,
        "current_price": current,
        "prev_price": prev,
        "high": high,
        "low": low,
        "daily_return": daily_return,
        "returns": asset_returns,
        "sector_avg_return": sector_avg,
        "history": history,
        "period": period,
    }