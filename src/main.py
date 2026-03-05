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
    history = []
    for date, price in prices.items():
        if not math.isnan(float(price)):
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "price": round(float(price), 4)
            })
    return history


def slice_history(history, days):
    """Recorta el historial a los últimos N días."""
    return history[-days:] if len(history) > days else history


def main():
    universe = pd.read_csv("data/universe.csv")
    results = []
    histories = {}

    for _, row in universe.iterrows():
        symbol = row["symbol"]
        sector = row["sector"]
        print(f"Procesando {symbol}...")
        try:
            # Un solo request con 1 año de datos
            prices_1y = get_prices(symbol, period="1y")
            returns = calculate_returns(prices_1y)
            results.append({
                "symbol": symbol,
                "sector": sector,
                "returns": returns
            })

            # Recortar para cada período
            full = build_history(prices_1y)
            histories[symbol] = {
                "1mo": slice_history(full, 22),   # ~22 días hábiles
                "3mo": slice_history(full, 66),
                "6mo": slice_history(full, 132),
                "1y":  full
            }

        except Exception as e:
            print(f"Error con {symbol}: {e}")

        time.sleep(2)

    save_snapshot(results)
    save_json("all_assets", {"assets": results})
    save_json("histories", histories)
    print(f"✅ {len(results)}/{len(universe)} activos procesados")

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