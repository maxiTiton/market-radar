import pandas as pd

from services.pricing import get_prices
from analytics.returns import calculate_returns
from analytics.movers import rank_assets
#from analytics.history import load_last_snapshots
from analytics.sectors import rank_sectors, top_by_sector

from reports.snapshot import save_snapshot
from reports.console import (
    print_ranking,
    #print_daily_changes,
    print_sector_ranking
)
from reports.json_export import save_json


def main():
    universe = pd.read_csv("data/universe.csv")
    results = []

    # 1️⃣ Recolectar datos de mercado
    for _, row in universe.iterrows():
        symbol = row["symbol"]
        sector = row["sector"]

        print(f"Procesando {symbol}...")

        try:
            prices = get_prices(symbol)
            returns = calculate_returns(prices)

            results.append({
                "symbol": symbol,
                "sector": sector,
                "returns": returns
            })

        except Exception as e:
            print(f"Error con {symbol}: {e}")

    # 2️⃣ Guardar snapshot histórico
    save_snapshot(results)

    # 3️⃣ Rankings por período
    for period, label in [
        ("daily", "Diario"),
        ("weekly", "Semanal"),
        ("monthly", "Mensual")
    ]:
        top = rank_assets(results, period, reverse=True)
        bottom = rank_assets(results, period, reverse=False)

        sectors_avg = rank_sectors(results, period)
        sector_top = top_by_sector(results, period)

        # Consola
        print_ranking(f"Top Movers {label}", top, period)
        print_ranking(f"Bottom Movers {label}", bottom, period)
        print_sector_ranking(f"Ranking de Sectores {label}", sectors_avg)

        # JSON para frontend
        save_json(period, {
            "top_movers": top[:10],
            "bottom_movers": bottom[:10],
            "sector_ranking": sectors_avg,
            "top_by_sector": sector_top
        })

    # 4️⃣ Comparación vs día anterior
    #yesterday, today = load_last_snapshots()
    #if yesterday is not None:
    #    print_daily_changes(yesterday, today)


if __name__ == "__main__":
    main()
