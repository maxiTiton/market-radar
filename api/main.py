import sys
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.market import router as market_router

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

REFRESH_MINUTES = 15


def run_scraper():
    try:
        import os
        root = Path(__file__).parent.parent
        original_dir = os.getcwd()
        os.chdir(root)

        print(f"\n📡 Actualizando market data... [{datetime.now().strftime('%H:%M:%S')}]")
        from src.main import main as scraper_main
        scraper_main()
        print(f"✅ Market data actualizado [{datetime.now().strftime('%H:%M:%S')}]\n")

    except Exception as e:
        print(f"❌ Error en scraper: {e}")
    finally:
        os.chdir(original_dir)


async def scheduler():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, run_scraper)
    while True:
        await asyncio.sleep(REFRESH_MINUTES * 60)
        await loop.run_in_executor(None, run_scraper)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(scheduler())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Market Radar API",
    version="0.2.0",
    lifespan=lifespan
)

# CORS — permite que Vercel llame al backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # después de deployar podés restringir a tu dominio de Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_router, prefix="/market")


@app.get("/")
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}