from fastapi import FastAPI
from api.routes.market import router as market_router

app = FastAPI(
    title="Market Radar API",
    version="0.1.0"
)

app.include_router(market_router, prefix="/market")


@app.get("/")
def health_check():
    return {"status": "ok"}
