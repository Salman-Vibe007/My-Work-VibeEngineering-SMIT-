import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from . import auth
from .api import auth as auth_api, chat, health, portfolio, prices, watchlist
from .db import connection
from .db.connection import PROJECT_ROOT
from .market import get_market_data_provider
from .market.cache import PriceCache
from .portfolio.snapshots import snapshot_loop

load_dotenv(PROJECT_ROOT / ".env")           # .env lives in the project root


@asynccontextmanager
async def lifespan(app: FastAPI):
    await asyncio.to_thread(connection.init_db)          # create tables (idempotent); RLS on Supabase
    cache = PriceCache()
    provider = get_market_data_provider(cache)
    await provider.start()
    app.state.price_cache = cache
    app.state.market_provider = provider
    app.state.supabase = auth.make_client()              # None in demo mode
    snap_task = asyncio.create_task(snapshot_loop(cache))
    yield
    snap_task.cancel()
    await provider.stop()
    if app.state.supabase is not None:
        await app.state.supabase.aclose()
    if connection.kind() == "postgres":
        connection.close_pools()


app = FastAPI(title="FinAlly", lifespan=lifespan)
for r in (auth_api.router, prices.router, portfolio.router, watchlist.router, chat.router, health.router):
    app.include_router(r, prefix="/api")

STATIC_DIR = Path(os.getenv("FINALLY_STATIC_DIR", PROJECT_ROOT / "static"))
if STATIC_DIR.is_dir():                       # mounted LAST so /api/* keeps precedence
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
