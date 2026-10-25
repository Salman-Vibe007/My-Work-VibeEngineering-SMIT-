import asyncio
from collections import deque
from .types import PriceTick, PricePoint, TICKER_UNIVERSE

HISTORY_MAXLEN = 100


class PriceCache:
    """Shared in-memory price cache + SSE fan-out. Only providers write to it."""

    def __init__(self) -> None:
        self._latest: dict[str, PriceTick] = {}
        self._history: dict[str, deque[PricePoint]] = {
            t: deque(maxlen=HISTORY_MAXLEN) for t in TICKER_UNIVERSE
        }
        self._subscribers: set[asyncio.Queue] = set()

    def update(self, tick: PriceTick) -> None:
        self._latest[tick.ticker] = tick
        self._history[tick.ticker].append(
            PricePoint(tick.ticker, tick.price, tick.timestamp)
        )
        for q in list(self._subscribers):
            try:
                q.put_nowait(tick)            # never awaits, never blocks the producer
            except asyncio.QueueFull:         # slow client: drop it so others are unaffected
                self._subscribers.discard(q)

    def seed_history(self, ticker: str, points: list[PricePoint]) -> None:
        self._history[ticker] = deque(points, maxlen=HISTORY_MAXLEN)

    def seed_history_point(self, ticker: str, point: PricePoint) -> None:
        """Append one backfill point WITHOUT touching _latest or notifying subscribers."""
        self._history[ticker].append(point)

    def latest(self, ticker: str) -> PriceTick | None:
        return self._latest.get(ticker)

    def all_latest(self) -> dict[str, PriceTick]:
        return dict(self._latest)

    def history(self, ticker: str) -> list[PricePoint]:
        return list(self._history.get(ticker, ()))

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=256)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._subscribers.discard(q)

    def is_subscribed(self, q: asyncio.Queue) -> bool:
        return q in self._subscribers
