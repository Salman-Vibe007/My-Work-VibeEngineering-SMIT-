"""Alpha Vantage price source (optional real data).

Alpha Vantage's GLOBAL_QUOTE returns ONE ticker per request, and free keys allow only a small number of
requests (about 25 per day at the time of writing; check your plan). So this provider:
  * fetches one ticker per request, always the ticker with the OLDEST price first (round robin);
  * spaces requests out so the daily budget lasts (burst quickly only while some ticker has no price yet);
  * saves prices and the request counter to a small JSON file, so restarting the app does not waste requests;
  * never writes the API key to logs.
Because of the request limits, prices change a few times per day, not every second. That is a limit of
the free plan, not a bug. Set ALPHAVANTAGE_DAILY_LIMIT / ALPHAVANTAGE_REQUESTS_PER_MINUTE to match your plan.
"""
import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx

from .cache import PriceCache
from .interface import MarketDataProvider
from .types import Direction, PricePoint, PriceTick, TICKER_UNIVERSE

logger = logging.getLogger(__name__)
for _noisy in ("httpx", "httpcore"):        # httpx logs every request URL at INFO, and our URL contains the API key
    logging.getLogger(_noisy).setLevel(logging.WARNING)
BASE_URL = "https://www.alphavantage.co"
QUOTA_BACKOFF = 3600.0          # seconds to wait after Alpha Vantage says "limit reached"
MAX_CONSECUTIVE_FAILURES = 5


def _utc_day() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


class AlphaVantageProvider(MarketDataProvider):
    def __init__(self, cache: PriceCache, client: httpx.AsyncClient, api_key: str, state_path: Path,
                 daily_limit: int = 25, requests_per_minute: float = 5.0,
                 fast_delay: float | None = None, steady_delay: float | None = None,
                 quota_backoff: float = QUOTA_BACKOFF) -> None:
        super().__init__(cache)
        self._client, self._key, self._state_path = client, api_key, Path(state_path)
        self._daily_limit = max(1, int(daily_limit))
        self._fast = fast_delay if fast_delay is not None else 60.0 / max(requests_per_minute, 0.1)
        self._steady = steady_delay if steady_delay is not None else max(self._fast, 86400.0 / self._daily_limit)
        self._quota_backoff = quota_backoff
        self._quotes: dict[str, dict] = {}          # ticker -> {price, prev_close, fetched_at}
        self._day, self._used = _utc_day(), 0
        self._task: asyncio.Task | None = None
        self._consecutive_failures = 0
        self.fatal_error: str | None = None
        self.ever_succeeded = False
        self.requests_made = 0

    # ---------------------------------------------------------------- lifecycle
    async def start(self) -> None:
        self._load_state()
        for t, q in self._quotes.items():           # show saved prices immediately (they may be hours old)
            self._publish(t, q, seed_prev=True, when=datetime.fromtimestamp(q["fetched_at"], tz=timezone.utc))
        if self._quotes:
            self.ever_succeeded = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
        await self._client.aclose()

    @property
    def is_healthy(self) -> bool:
        return self.fatal_error is None and self._consecutive_failures < MAX_CONSECUTIVE_FAILURES

    async def get_history(self, ticker: str, limit: int = 100) -> list[PricePoint]:
        return self.cache.history(ticker)[-limit:] if ticker in TICKER_UNIVERSE else []

    # ---------------------------------------------------------------- state file
    def _load_state(self) -> None:
        try:
            data = json.loads(self._state_path.read_text())
            self._quotes = {t: q for t, q in data.get("quotes", {}).items() if t in TICKER_UNIVERSE}
            if data.get("day") == _utc_day():
                self._day, self._used = data["day"], int(data.get("used", 0))
        except (OSError, ValueError, KeyError, TypeError):
            self._quotes = {}

    def _save_state(self) -> None:
        try:
            self._state_path.parent.mkdir(parents=True, exist_ok=True)
            tmp = self._state_path.with_suffix(".tmp")
            tmp.write_text(json.dumps({"day": self._day, "used": self._used, "quotes": self._quotes}))
            tmp.replace(self._state_path)           # atomic: never leaves a half-written file
        except OSError as exc:
            logger.warning("Could not save Alpha Vantage cache file: %s", type(exc).__name__)

    # ---------------------------------------------------------------- main loop
    def _missing(self) -> list[str]:
        return [t for t in TICKER_UNIVERSE if t not in self._quotes]

    def _next_ticker(self) -> str:
        return min(TICKER_UNIVERSE, key=lambda t: self._quotes.get(t, {}).get("fetched_at", 0))

    async def _loop(self) -> None:
        while self.fatal_error is None:
            if self._day != _utc_day():
                self._day, self._used = _utc_day(), 0
            if self._used >= self._daily_limit:
                logger.warning("Alpha Vantage daily budget (%d requests) used up; showing saved prices until tomorrow (UTC).",
                               self._daily_limit)
                await asyncio.sleep(600)
                continue
            outcome = await self.fetch_one(self._next_ticker())
            delay = self._fast if self._missing() else self._steady
            if outcome == "quota":
                delay = self._quota_backoff
            await asyncio.sleep(delay)

    # ---------------------------------------------------------------- one request
    async def fetch_one(self, ticker: str) -> str:
        """Returns "ok", "skip" (unknown symbol), "quota" (limit reached) or "error". Never logs the key."""
        self._used += 1
        self.requests_made += 1
        try:
            resp = await self._client.get("/query", params={"function": "GLOBAL_QUOTE", "symbol": ticker, "apikey": self._key})
            resp.raise_for_status()
            body = resp.json()
        except httpx.HTTPStatusError as exc:         # NOTE: str(exc) contains the URL (and key), so log only the code
            return self._error(f"HTTP {exc.response.status_code}")
        except (httpx.HTTPError, ValueError) as exc:
            return self._error(type(exc).__name__)
        quote = body.get("Global Quote") or {}
        if quote.get("05. price"):
            try:
                price, prev = float(quote["05. price"]), float(quote.get("08. previous close") or quote["05. price"])
            except ValueError:
                return self._error("unreadable quote")
            self._quotes[ticker] = {"price": price, "prev_close": prev, "fetched_at": time.time()}
            self._consecutive_failures = 0
            self.ever_succeeded = True
            self._publish(ticker, self._quotes[ticker], seed_prev=self.cache.latest(ticker) is None)
            self._save_state()
            return "ok"
        self._save_state()
        message = str(body.get("Information") or body.get("Note") or body.get("Error Message") or "")
        low = message.lower()
        if "invalid" in low and ("key" in low or "api" in low):
            self.fatal_error = "Alpha Vantage rejected the API key. Check ALPHAVANTAGE_API_KEY in .env."
            logger.error(self.fatal_error)
            return "error"
        if "premium" in low and "limit" not in low and "per day" not in low:
            self.fatal_error = "Alpha Vantage says this data needs a premium plan."
            logger.error(self.fatal_error)
            return "error"
        if message and not body.get("Error Message"):          # rate / daily limit wording varies; treat as quota
            logger.warning("Alpha Vantage limit reached: %s", message[:160])
            if not self._quotes:
                self.fatal_error = "Alpha Vantage request limit reached and there are no saved prices yet."
                logger.error(self.fatal_error)
            return "quota"
        logger.warning("Alpha Vantage returned no quote for %s", ticker)    # empty result: unknown symbol
        return "skip"

    def _error(self, why: str) -> str:
        self._consecutive_failures += 1
        n = self._consecutive_failures
        if n in (1, MAX_CONSECUTIVE_FAILURES) or n % 20 == 0:
            logger.warning("Alpha Vantage request failed (%d in a row): %s", n, why)
        return "error"

    # ---------------------------------------------------------------- publish to the shared cache
    def _publish(self, ticker: str, q: dict, seed_prev: bool, when: datetime | None = None) -> None:
        now = when or datetime.now(timezone.utc)
        last = self.cache.latest(ticker)
        if seed_prev and q["prev_close"] > 0:       # two points (previous close, now) so the chart can draw a line
            self.cache.seed_history_point(ticker, PricePoint(ticker, q["prev_close"], now - timedelta(days=1)))
        change = q["price"] - q["prev_close"]
        step = q["price"] - last.price if last else change
        self.cache.update(PriceTick(
            ticker=ticker, price=q["price"], prev_price=last.price if last else q["prev_close"],
            change=change, change_percent=(change / q["prev_close"] * 100) if q["prev_close"] else 0.0,
            direction=Direction.FLAT if step == 0 else (Direction.UP if step > 0 else Direction.DOWN), timestamp=now))
