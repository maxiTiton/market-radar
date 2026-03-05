import sys
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.market import router as market_router

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

# Argentina = UTC-3
ARG_TZ = timezone(timedelta(hours=-3))
# Hora de actualización diaria (18hs Argentina)
UPDATE_HOUR = 18


def run_scraper():
    try:
        import os
        root = Path(__file__).parent.parent
        original_dir = os.getcwd()
        os.chdir(root)

        now = datetime.now(ARG_TZ).strftime("%H:%M:%S")
        print(f"\n📡 Actualizando market data... [{now}]")
        from src.main import main as scraper_main
        scraper_main()
        print(f"✅ Market data actualizado [{datetime.now(ARG_TZ).strftime('%H:%M:%S')}]\n")

    except Exception as e:
        print(f"❌ Error en scraper: {e}")
    finally:
        os.chdir(original_dir)


async def seconds_until_next_update() -> float:
    """Calcula segundos hasta las 18hs Argentina del próximo día hábil."""
    now = datetime.now(ARG_TZ)
    target = now.replace(hour=UPDATE_HOUR, minute=0, second=0, microsecond=0)

    # Si ya pasaron las 18hs de hoy, apuntar a mañana
    if now >= target:
        target = target + timedelta(days=1)

    # Si cae sábado (5) o domingo (6), mover al lunes
    while target.weekday() >= 5:
        target = target + timedelta(days=1)

    diff = (target - now).total_seconds()
    return diff


async def scheduler():
    loop = asyncio.get_event_loop()

    # Primera corrida al arrancar (para tener datos disponibles)
    await loop.run_in_executor(None, run_scraper)

    # Luego corre diariamente a las 18hs Argentina
    while True:
        wait = await seconds_until_next_update()
        next_run = datetime.now(ARG_TZ) + timedelta(seconds=wait)
        print(f"⏰ Próxima actualización: {next_run.strftime('%a %d/%m %H:%M')} (Argentina)")
        await asyncio.sleep(wait)
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
    version="0.3.0",
    lifespan=lifespan
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