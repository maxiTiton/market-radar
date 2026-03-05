import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.market import router as market_router

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

ARG_TZ = timezone(timedelta(hours=-3))

app = FastAPI(
    title="Market Radar API",
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_router, prefix="/market")


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now(ARG_TZ).isoformat()
    }