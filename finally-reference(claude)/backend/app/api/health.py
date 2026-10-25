from fastapi import APIRouter, Request
from .. import auth
from ..db import connection

router = APIRouter()


@router.get("/health")
async def health(request: Request):
    healthy = request.app.state.market_provider.is_healthy
    return {"status": "ok" if healthy else "degraded",
            "market_data": getattr(request.app.state.market_provider, "active_name", type(request.app.state.market_provider).__name__),
            "market_data_healthy": healthy,
            "database": connection.kind(),
            "auth": "supabase" if auth.auth_enabled() else "demo"}
