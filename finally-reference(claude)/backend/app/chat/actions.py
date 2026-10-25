"""Validate + execute LLM-proposed actions through the SAME paths the UI uses."""
from ..db.connection import DEFAULT_USER
from ..market.cache import PriceCache
from ..portfolio.trades import execute_trade, TradeError
from ..watchlist import service as wl
from .llm import LLMResponse

MAX_ACTIONS = 10     # RECOMMENDATION (ARCHITECTURE.md open item #11): cap per turn


def execute_actions(conn, cache: PriceCache, resp: LLMResponse, user_id: str = DEFAULT_USER) -> list[dict]:
    results: list[dict] = []
    for t in resp.trades[:MAX_ACTIONS]:
        try:
            r = execute_trade(conn, cache, t.ticker, t.side, t.quantity, user_id)
            results.append({"type": "trade", "success": True,
                            "detail": f"{t.side.upper()} {r['quantity']:g} {r['ticker']} @ {r['price']:.2f}"})
        except TradeError as e:
            results.append({"type": "trade", "success": False,
                            "detail": f"{t.side.upper()} {t.quantity:g} {t.ticker} rejected: {e.message}"})
    for c in resp.watchlist_changes[:MAX_ACTIONS]:
        try:
            (wl.add_ticker if c.action == "add" else wl.remove_ticker)(conn, c.ticker, user_id)
            results.append({"type": "watchlist", "success": True, "detail": f"{c.action} {c.ticker.upper()}"})
        except wl.WatchlistError as e:
            results.append({"type": "watchlist", "success": False, "detail": str(e)})
    return results
