import os
import requests
import pandas as pd
from datetime import datetime, timedelta

FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY", "")
BASE_URL = "https://finnhub.io/api/v1"


def get_prices(symbol: str, period: str = "1mo") -> pd.Series:
    """
    Obtiene precios de cierre históricos desde Finnhub.
    Retorna una pd.Series con índice de fechas.
    """
    # Calcular rango de fechas
    end = datetime.now()
    if period == "1mo":
        start = end - timedelta(days=35)
    elif period == "3mo":
        start = end - timedelta(days=95)
    elif period == "6mo":
        start = end - timedelta(days=185)
    elif period == "1y":
        start = end - timedelta(days=370)
    else:
        start = end - timedelta(days=35)

    # Finnhub usa timestamps Unix
    from_ts = int(start.timestamp())
    to_ts = int(end.timestamp())

    # Convertir símbolo: .BA no existe en Finnhub, usamos solo el símbolo base
    finnhub_symbol = symbol.replace(".BA", "")

    url = f"{BASE_URL}/stock/candle"
    params = {
        "symbol": finnhub_symbol,
        "resolution": "D",
        "from": from_ts,
        "to": to_ts,
        "token": FINNHUB_API_KEY,
    }

    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    if data.get("s") != "ok" or not data.get("c"):
        raise ValueError(f"No data for {symbol}: {data.get('s')}")

    # Construir Series con fechas como índice
    timestamps = [datetime.fromtimestamp(ts) for ts in data["t"]]
    prices = pd.Series(data["c"], index=pd.DatetimeIndex(timestamps), name="Close")

    return prices