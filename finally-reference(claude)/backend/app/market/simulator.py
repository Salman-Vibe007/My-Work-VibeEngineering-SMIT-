import asyncio
import math
import random
from datetime import datetime, timedelta, timezone

from .interface import MarketDataProvider
from .cache import PriceCache, HISTORY_MAXLEN
from .types import PriceTick, PricePoint, Direction, TICKER_UNIVERSE
from .sim_config import (TICKER_CONFIG, EVENT_PROBABILITY, EVENT_MAGNITUDE_RANGE,
                         FactorLoadings)

TICK_INTERVAL = 0.5                                   # seconds
DT_YEARS = TICK_INTERVAL / (365 * 24 * 60 * 60)       # tick size in years


def gbm_step(price: float, mu: float, sigma: float, dt_years: float, z: float) -> float:
    """One discrete GBM step: S * exp((mu - sigma^2/2) dt + sigma sqrt(dt) Z)."""
    drift = (mu - 0.5 * sigma ** 2) * dt_years
    diffusion = sigma * math.sqrt(dt_years) * z
    return price * math.exp(drift + diffusion)


def draw_ticker_shock(rng: random.Random, z_market: float, z_sector: float,
                      loadings: FactorLoadings) -> float:
    z_idio = rng.gauss(0, 1)
    return (loadings.market * z_market + loadings.sector * z_sector
            + loadings.idio * z_idio)


def maybe_apply_event(rng: random.Random, price: float) -> float:
    if rng.random() >= EVENT_PROBABILITY:
        return price
    magnitude = rng.uniform(*EVENT_MAGNITUDE_RANGE)
    return price * (1 + rng.choice((1, -1)) * magnitude)


def _direction(change: float) -> Direction:
    return Direction.FLAT if change == 0 else (Direction.UP if change > 0 else Direction.DOWN)


class SimulatorProvider(MarketDataProvider):
    def __init__(self, cache: PriceCache, seed: int | None = None) -> None:
        super().__init__(cache)
        self._rng = random.Random(seed)
        self._prices: dict[str, float] = {t: c.seed_price for t, c in TICKER_CONFIG.items()}
        self._task: asyncio.Task | None = None

    async def start(self) -> None:
        self._backfill()
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()

    @property
    def is_healthy(self) -> bool:
        return True

    async def get_history(self, ticker: str, limit: int = 100) -> list[PricePoint]:
        if ticker not in TICKER_UNIVERSE:
            return []
        return self.cache.history(ticker)[-limit:]

    def _step_all_tickers(self) -> dict[str, float]:
        z_market = self._rng.gauss(0, 1)
        z_tech = self._rng.gauss(0, 1)
        out: dict[str, float] = {}
        for ticker, cfg in TICKER_CONFIG.items():
            z = draw_ticker_shock(self._rng, z_market, z_tech, cfg.loadings)
            price = gbm_step(self._prices[ticker], cfg.mu, cfg.sigma, DT_YEARS, z)
            out[ticker] = maybe_apply_event(self._rng, price)
        return out

    async def _run_loop(self) -> None:
        while True:
            await asyncio.sleep(TICK_INTERVAL)
            self._tick(now=datetime.now(timezone.utc))

    def _tick(self, now: datetime) -> None:
        for ticker, price in self._step_all_tickers().items():
            prev = self._prices[ticker]
            self._prices[ticker] = price
            change = price - prev
            self.cache.update(PriceTick(
                ticker=ticker, price=price, prev_price=prev, change=change,
                change_percent=(change / prev * 100) if prev else 0.0,
                direction=_direction(change), timestamp=now))

    def _backfill(self) -> None:
        now = datetime.now(timezone.utc)
        start = now - timedelta(seconds=TICK_INTERVAL * HISTORY_MAXLEN)
        for i in range(HISTORY_MAXLEN):
            ts = start + timedelta(seconds=TICK_INTERVAL * i)
            for ticker, price in self._step_all_tickers().items():
                self._prices[ticker] = price
                self.cache.seed_history_point(ticker, PricePoint(ticker, price, ts))
        for ticker, price in self._prices.items():      # publish one tick per ticker at "now"
            self.cache.update(PriceTick(ticker, price, price, 0.0, 0.0, Direction.FLAT, now))
