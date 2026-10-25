"""execute_trade(): the ONLY entry point for buying/selling (manual trade bar AND LLM actions)."""
import math

from ..db.connection import DEFAULT_USER, for_update, new_id, now_iso
from ..market.cache import PriceCache
from ..market.types import TICKER_UNIVERSE
from .valuation import total_value

EPS = 1e-9


class TradeError(Exception):
    def __init__(self, code: str, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.code, self.message, self.status = code, message, status


def execute_trade(conn, cache: PriceCache, ticker: str, side: str,
                  quantity: float, user_id: str = DEFAULT_USER) -> dict:
    ticker = (ticker or "").upper().strip()
    if ticker not in TICKER_UNIVERSE:
        raise TradeError("unsupported_ticker", f"{ticker or '?'} is not a supported ticker")
    if side not in ("buy", "sell"):
        raise TradeError("invalid_side", "side must be 'buy' or 'sell'")
    if not isinstance(quantity, (int, float)) or not math.isfinite(quantity) or quantity <= 0:
        raise TradeError("invalid_quantity", "quantity must be a positive number")
    tick = cache.latest(ticker)
    if tick is None:
        raise TradeError("price_unavailable", f"No live price for {ticker} yet", 503)
    price = tick.price                       # fill price comes from the cache, never re-fetched
    now = now_iso()

    with conn:                               # one SQLite transaction: commit or roll back
        cash = conn.execute("SELECT cash_balance FROM users_profile WHERE id=?" + for_update(),   # row lock on Postgres
                            (user_id,)).fetchone()["cash_balance"]
        pos = conn.execute("SELECT id, quantity, avg_cost FROM positions WHERE user_id=? AND ticker=?",
                           (user_id, ticker)).fetchone()
        if side == "buy":
            cost = price * quantity
            if cost > cash + EPS:
                raise TradeError("insufficient_cash",
                                 f"Need ${cost:,.2f} but only ${cash:,.2f} available")
            new_cash = cash - cost
            if pos:
                new_qty = pos["quantity"] + quantity
                new_avg = (pos["quantity"] * pos["avg_cost"] + cost) / new_qty
                conn.execute("UPDATE positions SET quantity=?, avg_cost=?, updated_at=? WHERE id=?",
                             (new_qty, new_avg, now, pos["id"]))
            else:
                conn.execute("INSERT INTO positions (id,user_id,ticker,quantity,avg_cost,updated_at)"
                             " VALUES (?,?,?,?,?,?)", (new_id(), user_id, ticker, quantity, price, now))
        else:
            if pos is None or quantity > pos["quantity"] + EPS:
                held = pos["quantity"] if pos else 0
                raise TradeError("insufficient_shares", f"Cannot sell {quantity:g} {ticker}; holding {held:g}")
            new_cash = cash + price * quantity
            remaining = pos["quantity"] - quantity
            if remaining <= EPS:             # exactly zero -> delete the row
                conn.execute("DELETE FROM positions WHERE id=?", (pos["id"],))
            else:
                conn.execute("UPDATE positions SET quantity=?, updated_at=? WHERE id=?",
                             (remaining, now, pos["id"]))
        conn.execute("UPDATE users_profile SET cash_balance=? WHERE id=?", (new_cash, user_id))
        conn.execute("INSERT INTO trades (id,user_id,ticker,side,quantity,price,executed_at)"
                     " VALUES (?,?,?,?,?,?,?)", (new_id(), user_id, ticker, side, quantity, price, now))
        conn.execute("INSERT INTO portfolio_snapshots (id,user_id,total_value,recorded_at) VALUES (?,?,?,?)",
                     (new_id(), user_id, total_value(conn, cache, user_id), now))
    return {"ticker": ticker, "side": side, "quantity": quantity, "price": price, "cash_balance": new_cash}
