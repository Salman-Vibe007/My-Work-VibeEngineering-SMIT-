from ..db.connection import DEFAULT_USER, new_id, now_iso
from ..market.cache import PriceCache
from ..market.types import TICKER_UNIVERSE


class WatchlistError(Exception):
    pass


def list_watchlist(conn, cache: PriceCache, user_id: str = DEFAULT_USER) -> list[dict]:
    rows = conn.execute("SELECT ticker FROM watchlist WHERE user_id=? ORDER BY added_at, ticker",
                        (user_id,)).fetchall()
    out = []
    for r in rows:
        t = cache.latest(r["ticker"])
        out.append({"ticker": r["ticker"],
                    "price": t.price if t else None, "prev_price": t.prev_price if t else None,
                    "change_percent": t.change_percent if t else None,
                    "direction": t.direction.value if t else "flat"})
    return out


def add_ticker(conn, ticker: str, user_id: str = DEFAULT_USER) -> None:
    ticker = (ticker or "").upper().strip()
    if ticker not in TICKER_UNIVERSE:
        raise WatchlistError(f"{ticker or '?'} is not one of the 10 supported tickers")
    with conn:
        conn.execute("INSERT INTO watchlist (id,user_id,ticker,added_at) VALUES (?,?,?,?) "
                     "ON CONFLICT (user_id, ticker) DO NOTHING", (new_id(), user_id, ticker, now_iso()))


def remove_ticker(conn, ticker: str, user_id: str = DEFAULT_USER) -> None:
    ticker = (ticker or "").upper().strip()
    with conn:
        conn.execute("DELETE FROM watchlist WHERE user_id=? AND ticker=?", (user_id, ticker))
