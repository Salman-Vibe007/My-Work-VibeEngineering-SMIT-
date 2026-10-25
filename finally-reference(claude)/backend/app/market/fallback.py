"""Use Alpha Vantage when it works; switch to the built-in simulator when it cannot (bad key, plan without
snapshot access, or no data ever arrives), so the app never ends up with an empty price board."""
import asyncio
import logging

from .cache import PriceCache
from .interface import MarketDataProvider
from .alphavantage import AlphaVantageProvider
from .simulator import SimulatorProvider
from .types import PricePoint

logger = logging.getLogger(__name__)


class FallbackProvider(MarketDataProvider):
    def __init__(self, cache: PriceCache, primary: AlphaVantageProvider, watch_interval: float = 2.0) -> None:
        super().__init__(cache)
        self._primary: MarketDataProvider = primary
        self._active: MarketDataProvider = primary
        self._watch_interval = watch_interval
        self._task: asyncio.Task | None = None

    @property
    def active_name(self) -> str:
        return type(self._active).__name__

    async def start(self) -> None:
        await self._primary.start()
        self._task = asyncio.create_task(self._watch())

    async def _watch(self) -> None:
        while self._active is self._primary:
            await asyncio.sleep(self._watch_interval)
            p = self._primary
            if p.fatal_error or (not p.is_healthy and not p.ever_succeeded):
                logger.error("Falling back to SIMULATED prices. Reason: %s",
                             p.fatal_error or "Alpha Vantage is not returning data")
                await p.stop()
                self._active = SimulatorProvider(self.cache)
                await self._active.start()

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
        await self._active.stop()
        if self._active is not self._primary:
            await self._primary.stop()

    async def get_history(self, ticker: str, limit: int = 100) -> list[PricePoint]:
        return await self._active.get_history(ticker, limit)

    @property
    def is_healthy(self) -> bool:
        return self._active.is_healthy
