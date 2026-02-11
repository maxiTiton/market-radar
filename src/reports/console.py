def print_ranking(title, ranking, period):
    print(f"\n{title}")
    print("-" * len(title))

    for asset in ranking:
        value = asset["returns"][period]
        print(
            f"{asset['symbol']:8} | "
            f"{asset['sector']:12} | "
            f"{value:6.2f}%"
        )

def print_daily_changes(yesterday, today):
    print("\nCambios vs día anterior")
    print("------------------------")

    merged = today.merge(
        yesterday,
        on="symbol",
        suffixes=("_today", "_yesterday")
    )

    merged["delta"] = (
        merged["daily_today"] - merged["daily_yesterday"]
    )

    top = merged.sort_values("delta", ascending=False).head(5)

    for _, row in top.iterrows():
        print(
            f"{row['symbol']:8} | "
            f"{row['sector_today']:12} | "
            f"{row['delta']:+.2f}%"
        )

def print_sector_ranking(title, sectors):
    print("\n" + "=" * len(title))
    print(title)
    print("=" * len(title))

    for i, item in enumerate(sectors, start=1):
        sector = item["sector"]
        avg = item["avg_return"]
        count = item["count"]

        print(f"{i:>2}. {sector:<15} {avg:+.2f}%  ({count} activos)")
