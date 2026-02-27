from fastapi import APIRouter, HTTPException
import json
import sys
from pathlib import Path

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
    try:
        import yfinance as yf
        import math

        allowed_periods = ["1mo", "3mo", "6mo", "1y"]
        if period not in allowed_periods:
            period = "3mo"

        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)

        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data for {symbol}")

        prices = hist["Close"]

        # Build price history for chart
        history = []
        for date, price in prices.items():
            if not math.isnan(price):
                history.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "price": round(float(price), 4)
                })

        if len(history) < 2:
            raise HTTPException(status_code=404, detail=f"Insufficient data for {symbol}")

        current = history[-1]["price"]
        prev    = history[-2]["price"]
        high    = round(float(prices.max()), 4)
        low     = round(float(prices.min()), 4)
        daily_return = round((current / prev - 1) * 100, 2)

        # Get sector from all_assets
        all_data = load_json("all_assets.json")
        sector = "Unknown"
        asset_returns = None
        for a in all_data.get("assets", []):
            if a["symbol"].upper() == symbol.upper():
                sector = a["sector"]
                asset_returns = a["returns"]
                break

        # Sector avg returns for comparison
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

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))