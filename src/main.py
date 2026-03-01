import pandas as pd
import yfinance as yf
from analytics.returns import calculate_returns
from analytics.movers import rank_assets
from analytics.sectors import rank_sectors, top_by_sector
from reports.snapshot import save_snapshot
from reports.console import print_ranking, print_sector_ranking
from reports.json_export import save_json


def main():
    universe = pd.read_csv("data/universe.csv")
    symbols = universe["symbol"].tolist()
    sectors = dict(zip(universe["symbol"], universe["sector"]))

    print(f"📥 Descargando {len(symbols)} activos en batch...")

    # Descarga todos los tickers en un solo request
    raw = yf.download(
        tickers=symbols,
        period="1mo",
        interval="1d",
        group_by="ticker",
        auto_adjust=True,
        threads=True,
        progress=False
    )

    results = []

    for symbol in symbols:
        try:
            # Extraer precios del ticker del DataFrame multi-nivel
            if len(symbols) > 1:
                prices = raw["Close"][symbol].dropna()
            else:
                prices = raw["Close"].dropna()

            if len(prices) < 2:
                print(f"Sin datos suficientes: {symbol}")
                continue

            returns = calculate_returns(prices)
            results.append({
                "symbol": symbol,
                "sector": sectors[symbol],
                "returns": returns
            })
            print(f"✓ {symbol}")

        except Exception as e:
            print(f"Error con {symbol}: {e}")

    print(f"\n✅ {len(results)}/{len(symbols)} activos procesados")

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