import asyncio
import json
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from ..market.types import TICKER_UNIVERSE

router = APIRouter()


@router.get("/stream/prices")
async def stream_prices(request: Request):
    """Public market-data stream (same for every user, contains no account data)."""
    cache = request.app.state.price_cache
    q = cache.subscribe()

    async def event_source():
        try:
            for tick in cache.all_latest().values():        # initial snapshot
                yield f"data: {json.dumps(tick.to_dict())}\n\n"
            while True:
                try:
                    tick = await asyncio.wait_for(q.get(), timeout=15)
                except asyncio.TimeoutError:
                    if not cache.is_subscribed(q):          # dropped for being too slow
                        return
                    yield ": keep-alive\n\n"
                    continue
                if await request.is_disconnected():
                    return
                yield f"data: {json.dumps(tick.to_dict())}\n\n"
        finally:
            cache.unsubscribe(q)

    return StreamingResponse(event_source(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/prices/{ticker}/history")
async def price_history(ticker: str, request: Request):
    ticker = ticker.upper()
    if ticker not in TICKER_UNIVERSE:
        raise HTTPException(404, detail={"code": "unsupported_ticker", "message": f"{ticker} not supported"})
    points = await request.app.state.market_provider.get_history(ticker)
    return [p.to_dict() for p in points]
