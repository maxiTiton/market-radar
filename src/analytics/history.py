import pandas as pd
import os

def load_last_snapshots():
    files = sorted(os.listdir("data/results"))
    if len(files) < 2:
        return None, None

    yesterday = pd.read_csv(f"data/results/{files[-2]}")
    today = pd.read_csv(f"data/results/{files[-1]}")

    return yesterday, today
