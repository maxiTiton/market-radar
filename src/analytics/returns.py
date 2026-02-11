def calculate_returns(prices):
    daily = prices.pct_change().iloc[-1] * 100

    weekly = None
    if len(prices) >= 6:
        weekly = (prices.iloc[-1] / prices.iloc[-6] - 1) * 100

    monthly = (prices.iloc[-1] / prices.iloc[0] - 1) * 100

    return {
        "daily": daily,
        "weekly": weekly,
        "monthly": monthly
    }

