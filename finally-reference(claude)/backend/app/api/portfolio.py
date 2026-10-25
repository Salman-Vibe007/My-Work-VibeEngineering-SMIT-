from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from ..auth import current_user
from ..db import connection
from ..portfolio.trades import execute_trade, TradeError
from ..portfolio.valuation import get_portfolio

router = APIRouter(prefix="/portfolio")     # sync endpoints run in FastAPI's thread pool (DB calls may block)


class TradeRequest(BaseModel):
    ticker: str
    quantity: float
    side: Literal["buy", "sell"]


@router.get("")
def portfolio(request: Request, user_id: str = Depends(current_user)):
    conn = connection.connect()
    try:
        return get_portfolio(conn, request.app.state.price_cache, user_id)
    finally:
        conn.close()


@router.post("/trade")
def trade(body: TradeRequest, request: Request, user_id: str = Depends(current_user)):
    conn = connection.connect()
    try:
        return execute_trade(conn, request.app.state.price_cache, body.ticker, body.side, body.quantity, user_id)
    except TradeError as e:
        raise HTTPException(e.status, detail={"code": e.code, "message": e.message})
    finally:
        conn.close()


@router.get("/history")
def history(user_id: str = Depends(current_user)):
    conn = connection.connect()
    try:
        rows = conn.execute("SELECT total_value, recorded_at FROM portfolio_snapshots WHERE user_id=? "
                            "ORDER BY recorded_at", (user_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
