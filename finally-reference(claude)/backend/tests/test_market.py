import asyncio
import httpx
import pytest
from app.market.cache import PriceCache, HISTORY_MAXLEN
from app.market.simulator import SimulatorProvider, gbm_step
from app.market.types import TICKER_UNIVERSE, Direction


def test_gbm_zero_shock_is_pure_drift():
    p = gbm_step(100.0, 0.10, 0.2, 1.0, 0.0)          # one full year, Z = 0
    assert p == pytest.approx(100 * 2.718281828 ** (0.10 - 0.02), rel=1e-6)


def test_simulator_is_deterministic_with_seed():
    def run(seed):
        c = PriceCache(); s = SimulatorProvider(c, seed=seed); s._backfill()
        return [round(c.latest(t).price, 8) for t in TICKER_UNIVERSE]
    assert run(42) == run(42) and run(42) != run(43)


def test_backfill_fills_history_and_latest_for_all_ten():
    c = PriceCache(); SimulatorProvider(c, seed=1)._backfill()
    for t in TICKER_UNIVERSE:
        assert c.latest(t) is not None
        assert len(c.history(t)) == HISTORY_MAXLEN
    assert all(v.price > 0 for v in c.all_latest().values())


def test_simulator_loop_publishes_ticks():
    async def go():
        c = PriceCache(); p = SimulatorProvider(c, seed=1)
        q = c.subscribe(); await p.start()
        await asyncio.sleep(0.7); await p.stop()
        return q.qsize()
    assert asyncio.run(go()) >= len(TICKER_UNIVERSE)   # at least one full tick round


def test_slow_subscriber_is_dropped_not_blocking():
    c = PriceCache(); q = c.subscribe(); SimulatorProvider(c, seed=1)._backfill()
    for _ in range(300):                                # overflow the 256-slot queue
        c.update(c.latest("AAPL"))
    assert not c.is_subscribed(q)


def test_history_empty_for_unsupported_ticker():
    async def go():
        return await SimulatorProvider(PriceCache(), seed=1).get_history("ZZZZ")
    assert asyncio.run(go()) == []
