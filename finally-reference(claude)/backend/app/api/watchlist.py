from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from ..auth import current_user
from ..db import connection
from ..watchlist import service

router = APIRouter(prefix="/watchlist")


class AddTicker(BaseModel):
    ticker: str


@router.get("")
def get_watchlist(request: Request, user_id: str = Depends(current_user)):
    conn = connection.connect()
    try:
        return service.list_watchlist(conn, request.app.state.price_cache, user_id)
    finally:
        conn.close()


@router.post("")
def add(body: AddTicker, request: Request, user_id: str = Depends(current_user)):
    conn = connection.connect()
    try:
        service.add_ticker(conn, body.ticker, user_id)
        return service.list_watchlist(conn, request.app.state.price_cache, user_id)
    except service.WatchlistError as e:
        raise HTTPException(400, detail={"code": "unsupported_ticker", "message": str(e)})
    finally:
        conn.close()


@router.delete("/{ticker}", status_code=204)
def remove(ticker: str, user_id: str = Depends(current_user)):
    conn = connection.connect()
    try:
        service.remove_ticker(conn, ticker, user_id)
    finally:
        conn.close()
    return Response(status_code=204)
