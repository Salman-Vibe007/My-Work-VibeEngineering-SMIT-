from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

TICKER_UNIVERSE: tuple[str, ...] = (
    "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA",
    "NVDA", "META", "JPM", "V", "NFLX",
)


class Direction(str, Enum):
    UP = "up"
    DOWN = "down"
    FLAT = "flat"


@dataclass(frozen=True, slots=True)
class PriceTick:
    """One live price update for a single ticker."""
    ticker: str
    price: float
    prev_price: float
    change: float             # price - prev_price
    change_percent: float     # change / prev_price * 100
    direction: Direction
    timestamp: datetime       # UTC

    def to_dict(self) -> dict:
        return {
            "ticker": self.ticker, "price": round(self.price, 4),
            "prev_price": round(self.prev_price, 4),
            "change": round(self.change, 4),
            "change_percent": round(self.change_percent, 4),
            "direction": self.direction.value,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass(frozen=True, slots=True)
class PricePoint:
    """One point in a rolling/backfill history buffer."""
    ticker: str
    price: float
    timestamp: datetime       # UTC

    def to_dict(self) -> dict:
        return {"ticker": self.ticker, "price": round(self.price, 4),
                "timestamp": self.timestamp.isoformat()}
