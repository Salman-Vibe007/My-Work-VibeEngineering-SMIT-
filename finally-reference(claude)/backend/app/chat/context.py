from ..db.connection import DEFAULT_USER
from ..market.cache import PriceCache
from ..portfolio.valuation import get_portfolio
from ..watchlist.service import list_watchlist

SYSTEM_PROMPT = """You are FinAlly, an AI trading assistant inside a simulated trading workstation.
- Analyze portfolio composition, risk concentration and P&L.
- Suggest trades with brief reasoning; execute trades when the user asks or agrees.
- Manage the watchlist proactively. Only these tickers exist: AAPL, GOOGL, MSFT, AMZN, TSLA, NVDA, META, JPM, V, NFLX.
- Be concise and data-driven.
- ALWAYS reply with valid JSON: {"message": str, "trades": [{"ticker","side","quantity"}], "watchlist_changes": [{"ticker","action"}]}.
- Leave "trades" and "watchlist_changes" empty unless an action is requested."""


def portfolio_context(conn, cache: PriceCache, user_id: str = DEFAULT_USER) -> str:
    p = get_portfolio(conn, cache, user_id)
    lines = [f"Cash: ${p['cash_balance']:,.2f}", f"Total value: ${p['total_value']:,.2f}", "Positions:"]
    lines += [f"  {x['ticker']}: {x['quantity']:g} @ avg {x['avg_cost']:.2f}, now {x['current_price']:.2f}, "
              f"P&L {x['unrealized_pnl']:+.2f} ({x['pnl_percent']:+.2f}%)" for x in p["positions"]] or ["  (none)"]
    wl = list_watchlist(conn, cache, user_id)
    lines.append("Watchlist: " + ", ".join(f"{w['ticker']} {w['price']:.2f}" if w["price"] else w["ticker"] for w in wl))
    return "\n".join(lines)


def build_messages(conn, cache: PriceCache, user_text: str, user_id: str = DEFAULT_USER) -> list[dict]:
    rows = conn.execute("SELECT role, content FROM chat_messages WHERE user_id=? "
                        "ORDER BY created_at DESC LIMIT 10", (user_id,)).fetchall()
    history = [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]
    return ([{"role": "system", "content": SYSTEM_PROMPT},
             {"role": "system", "content": "Current state:\n" + portfolio_context(conn, cache, user_id)}]
            + history + [{"role": "user", "content": user_text}])
