import asyncio
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from src.main import scheduler
from api.routes.market import router as market_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(scheduler())
    yield


app = FastAPI(
    title="Market Radar API",
    version="0.1.0",
    lifespan=lifespan
)

# 🔥 CORS (para que el frontend pueda pegarle al backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.100:3000",  # por si entrás desde el celu / otra PC
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_router, prefix="/market")


@app.get("/")
def health_check():
    return {"status": "ok"}
