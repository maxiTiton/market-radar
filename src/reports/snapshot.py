import pandas as pd
import os
from datetime import datetime


def save_snapshot(results):
    """
    Guarda un snapshot diario del mercado para comparaciones históricas.
    """

    os.makedirs("data/snapshots", exist_ok=True)

    today = datetime.now().strftime("%Y-%m-%d")
    path = f"data/snapshots/market_{today}.csv"

    rows = []

    for asset in results:
        row = {
            "symbol": asset["symbol"],
            "sector": asset["sector"],
            "daily": asset["returns"].get("daily"),
            "weekly": asset["returns"].get("weekly"),
            "monthly": asset["returns"].get("monthly"),
        }
        rows.append(row)

    df = pd.DataFrame(rows)
    df.to_csv(path, index=False)
