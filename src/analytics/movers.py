def rank_assets(results, period, top_n=5, reverse=True):
    valid = [r for r in results if r["returns"][period] is not None]

    return sorted(
        valid,
        key=lambda x: x["returns"][period],
        reverse=reverse
    )[:top_n]
