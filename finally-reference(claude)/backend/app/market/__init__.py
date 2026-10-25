import os
from pathlib import Path

import httpx

from ..db import connection
from .alphavantage import AlphaVantageProvider, BASE_URL
from .cache import PriceCache
from .fallback import FallbackProvider
from .interface import MarketDataProvider
from .simulator import SimulatorProvider


def get_market_data_provider(cache: PriceCache) -> MarketDataProvider:
    """Startup-time provider selection: ALPHAVANTAGE_API_KEY set -> real data (with automatic fallback to the
    simulator if Alpha Vantage cannot be used); otherwise the built-in simulator."""
    key = os.getenv("ALPHAVANTAGE_API_KEY", "").strip()
    if not key:
        return SimulatorProvider(cache)
    state = os.getenv("ALPHAVANTAGE_CACHE_FILE") or str(Path(connection.db_path()).parent / "alphavantage_cache.json")
    provider = AlphaVantageProvider(
        cache, httpx.AsyncClient(base_url=BASE_URL, timeout=15.0), key, Path(state),
        daily_limit=int(os.getenv("ALPHAVANTAGE_DAILY_LIMIT", "25")),
        requests_per_minute=float(os.getenv("ALPHAVANTAGE_REQUESTS_PER_MINUTE", "5")),
        steady_delay=float(os.environ["ALPHAVANTAGE_POLL_INTERVAL_SECONDS"]) if os.getenv("ALPHAVANTAGE_POLL_INTERVAL_SECONDS") else None)
    return FallbackProvider(cache, provider)
