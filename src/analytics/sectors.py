from collections import defaultdict


def rank_sectors(results, period):
    """
    Ranking de sectores por rendimiento promedio.
    period: 'daily' | 'weekly' | 'monthly'
    """

    sectors = defaultdict(list)

    for r in results:
        sector = r["sector"]
        returns = r.get("returns", {})

        if period in returns:
            sectors[sector].append(returns[period])

    ranking = []
    for sector, values in sectors.items():
        if values:
            ranking.append({
                "sector": sector,
                "avg_return": sum(values) / len(values),
                "count": len(values)
            })

    ranking.sort(key=lambda x: x["avg_return"], reverse=True)
    return ranking


def top_by_sector(results, period, top_n=3):
    """
    Devuelve el top N activos por sector para un período.
    """

    grouped = defaultdict(list)

    # Agrupar activos por sector
    for r in results:
        sector = r["sector"]
        returns = r.get("returns", {})

        if period in returns:
            grouped[sector].append({
                "symbol": r["symbol"],
                "return": returns[period],
                "type": r.get("type", "Unknown")
            })

    # Ordenar y recortar top N
    top_sectors = {}

    for sector, assets in grouped.items():
        assets_sorted = sorted(
            assets,
            key=lambda x: x["return"],
            reverse=True
        )

        top_sectors[sector] = assets_sorted[:top_n]

    return top_sectors
