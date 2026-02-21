import asyncio
import pandas as pd

from src.services.pricing import get_prices
from src.analytics.returns import calculate_returns
from src.analytics.movers import rank_assets
from src.analytics.sectors import rank_sectors, top_by_sector
from src.reports.snapshot import save_snapshot
from src.reports.console import print_ranking, print_sector_ranking
from src.reports.json_export import save_json


def generate_reports():
    universe = pd.read_csv("data/universe.csv")
    results = []

    print("📡 Actualizando market data...")

    # 1️⃣ Recolectar datos de mercado
    for _, row in universe.iterrows():
        symbol = row["symbol"]
        sector = row["sector"]

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

        # JSON para frontend (pisan los existentes)
        save_json(period, {
            "top_movers": top[:10],
            "bottom_movers": bottom[:10],
            "sector_ranking": sectors_avg,
            "top_by_sector": sector_top
        })


async def scheduler():
    while True:
        generate_reports()
        await asyncio.sleep(30)  # ⏱️ cada 30 segundos


if __name__ == "__main__":
    asyncio.run(scheduler())
