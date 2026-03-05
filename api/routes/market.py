import json
import math
from pathlib import Path
from fastapi import APIRouter, HTTPException
import sys

router = APIRouter()
BASE_PATH = Path("data/output")
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


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


@router.get("/asset/{symbol}")
def asset_detail(symbol: str, period: str = "3mo"):
    allowed = ["1mo", "3mo", "6mo", "1y"]
    if period not in allowed:
        period = "3mo"

    # Cargar historial desde JSON (generado por GitHub Actions)
    histories = load_json("histories.json")
    if "error" in histories:
        raise HTTPException(status_code=503, detail="History data not available yet")

    symbol_upper = symbol.upper()
    asset_history = histories.get(symbol_upper) or histories.get(symbol)

    if not asset_history:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")

    history = asset_history.get(period, [])

    if len(history) < 2:
        raise HTTPException(status_code=404, detail=f"Insufficient data for {symbol}")

    current = history[-1]["price"]
    prev    = history[-2]["price"]
    high    = max(h["price"] for h in history)
    low     = min(h["price"] for h in history)
    daily_return = round((current / prev - 1) * 100, 2)

    # Datos del activo desde all_assets
    all_data = load_json("all_assets.json")
    sector = "Unknown"
    asset_returns = None
    for a in all_data.get("assets", []):
        if a["symbol"].upper() == symbol_upper:
            sector = a["sector"]
            asset_returns = a["returns"]
            break

    # Promedio del sector
    daily_data = load_json("daily.json")
    sector_avg = None
    for s in daily_data.get("sector_ranking", []):
        if s["sector"] == sector:
            sector_avg = s["avg_return"]
            break

    return {
        "symbol": symbol_upper,
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