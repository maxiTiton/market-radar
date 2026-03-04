import time
import pandas as pd
from services.pricing import get_prices
from analytics.returns import calculate_returns
from analytics.movers import rank_assets
from analytics.sectors import rank_sectors, top_by_sector
from reports.snapshot import save_snapshot
from reports.console import print_ranking, print_sector_ranking
from reports.json_export import save_json

REQUESTS_PER_MINUTE = 55  # un poco menos de 60 para margen
DELAY_BETWEEN = 60 / REQUESTS_PER_MINUTE  # ~1.09 segundos entre requests


def main():
    universe = pd.read_csv("data/universe.csv")
    results = []

    print(f"📥 Procesando {len(universe)} activos (Finnhub, ~{DELAY_BETWEEN:.1f}s entre requests)...")

    for i, (_, row) in enumerate(universe.iterrows()):
        symbol = row["symbol"]
        sector = row["sector"]
        print(f"[{i+1}/{len(universe)}] {symbol}...")
        try:
            prices = get_prices(symbol)
            returns = calculate_returns(prices)
            results.append({
                "symbol": symbol,
                "sector": sector,
                "returns": returns
            })
        except Exception as e:
            print(f"  ✗ Error: {e}")

        time.sleep(DELAY_BETWEEN)

    print(f"\n✅ {len(results)}/{len(universe)} activos procesados")

    save_snapshot(results)
    save_json("all_assets", {"assets": results})

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