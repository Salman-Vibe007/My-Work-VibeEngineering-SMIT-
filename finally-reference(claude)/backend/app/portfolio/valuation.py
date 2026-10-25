from ..market.cache import PriceCache
from ..db.connection import DEFAULT_USER


def get_portfolio(conn, cache: PriceCache, user_id: str = DEFAULT_USER) -> dict:
    cash = conn.execute("SELECT cash_balance FROM users_profile WHERE id=?", (user_id,)).fetchone()["cash_balance"]
    positions, market_value, total_pnl = [], 0.0, 0.0
    rows = conn.execute("SELECT ticker, quantity, avg_cost FROM positions WHERE user_id=? ORDER BY ticker",
                        (user_id,)).fetchall()
    for r in rows:
        tick = cache.latest(r["ticker"])
        price = tick.price if tick else r["avg_cost"]      # fall back to cost if no price yet
        pnl = (price - r["avg_cost"]) * r["quantity"]
        market_value += price * r["quantity"]
        total_pnl += pnl
        positions.append({
            "ticker": r["ticker"], "quantity": r["quantity"], "avg_cost": r["avg_cost"],
            "current_price": price, "unrealized_pnl": pnl,
            "pnl_percent": (price / r["avg_cost"] - 1) * 100 if r["avg_cost"] else 0.0,
        })
    return {"cash_balance": cash, "positions": positions,
            "total_value": cash + market_value, "total_pnl": total_pnl}


def total_value(conn, cache: PriceCache, user_id: str = DEFAULT_USER) -> float:
    return get_portfolio(conn, cache, user_id)["total_value"]
