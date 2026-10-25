from abc import ABC, abstractmethod
from .types import PricePoint
from .cache import PriceCache


class MarketDataProvider(ABC):
    """Contract both SimulatorProvider and AlphaVantageProvider must satisfy."""

    def __init__(self, cache: PriceCache) -> None:
        self.cache = cache

    @abstractmethod
    async def start(self) -> None:
        """Schedule the background loop and return (must not block forever)."""

    @abstractmethod
    async def stop(self) -> None:
        """Cancel the background task and release resources."""

    @abstractmethod
    async def get_history(self, ticker: str, limit: int = 100) -> list[PricePoint]:
        """Up to `limit` recent points, oldest first; [] for unsupported tickers."""

    @property
    @abstractmethod
    def is_healthy(self) -> bool:
        """False after N consecutive update failures; read by /api/health."""
