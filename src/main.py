import time
import math
import pandas as pd
from services.pricing import get_prices
from analytics.returns import calculate_returns
from analytics.movers import rank_assets
from analytics.sectors import rank_sectors, top_by_sector
from reports.snapshot import save_snapshot
from reports.console import print_ranking, print_sector_ranking
from reports.json_export import save_json


def build_history(prices):
    """Convierte una Series de precios en lista de {date, price}."""
    history = []
    for date, price in prices.items():
        if not math.isnan(float(price)):
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "price": round(float(price), 4)
            })
    return history


def main():
    universe = pd.read_csv("data/universe.csv")
    results = []
    histories = {}  # symbol -> {1mo, 3mo, 6mo, 1y}

    for _, row in universe.iterrows():
        symbol = row["symbol"]
        sector = row["sector"]
        print(f"Procesando {symbol}...")
        try:
            # Precios 1mo para retornos
            prices_1mo = get_prices(symbol, period="1mo")
            returns = calculate_returns(prices_1mo)
            results.append({
                "symbol": symbol,
                "sector": sector,
                "returns": returns
            })

            # Historial extendido para gráficos
            histories[symbol] = {
                "1mo": build_history(prices_1mo),
            }
            time.sleep(2)

            prices_3mo = get_prices(symbol, period="3mo")
            histories[symbol]["3mo"] = build_history(prices_3mo)
            time.sleep(2)

            prices_6mo = get_prices(symbol, period="6mo")
            histories[symbol]["6mo"] = build_history(prices_6mo)
            time.sleep(2)

            prices_1y = get_prices(symbol, period="1y")
            histories[symbol]["1y"] = build_history(prices_1y)
            time.sleep(2)

        except Exception as e:
            print(f"Error con {symbol}: {e}")
            time.sleep(2)

    # Guardar datos principales
    save_snapshot(results)
    save_json("all_assets", {"assets": results})

    # Guardar historial de precios por activo
    save_json("histories", histories)
    print(f"✅ Historial guardado para {len(histories)} activos")

    for period, label in [
        ("daily", "Diario"),
        ("weekly", "Semanal"),
        ("monthly", "Mensual")
    ]:
        top = rank_assets(results, period, reverse=True)
        bottom = rank_assets(results, period, reverse=False)
        sectors_avg = rank_sectors(results, period)
        sector_top = top_by_sector(results, period)

        print_ranking(f"Top Movers {label}", top, period)
        print_ranking(f"Bottom Movers {label}", bottom, period)
        print_sector_ranking(f"Ranking de Sectores {label}", sectors_avg)

        save_json(period, {
            "top_movers": top[:10],
            "bottom_movers": bottom[:10],
            "sector_ranking": sectors_avg,
            "top_by_sector": sector_top
        })


if __name__ == "__main__":
    main()