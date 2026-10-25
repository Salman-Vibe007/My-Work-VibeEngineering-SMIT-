"""Authentication through Supabase Auth (GoTrue), email + password only.

The browser talks to THIS backend (same origin). The backend forwards sign-up / log-in to Supabase,
and verifies every API request's access token by asking Supabase (GET /auth/v1/user), with a short cache.
No Google / Microsoft / OAuth providers are used.

Mode switch: SUPABASE_URL set  -> login required, each user has their own portfolio.
             SUPABASE_URL empty -> "demo mode": no login, one shared user called "default".
"""
import asyncio
import hashlib
import os
import re
import time

import httpx
from fastapi import HTTPException, Request

from .db import connection

DEMO_USER = connection.DEFAULT_USER
TOKEN_CACHE_SECONDS = 60
_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD = 8


def auth_enabled() -> bool:
    return bool(os.getenv("SUPABASE_URL", "").strip())


def make_client() -> httpx.AsyncClient | None:
    if not auth_enabled():
        return None
    key = os.getenv("SUPABASE_ANON_KEY", "").strip()
    return httpx.AsyncClient(base_url=os.getenv("SUPABASE_URL").strip().rstrip("/"),
                             headers={"apikey": key, "Content-Type": "application/json"}, timeout=10.0)


def api_error(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status, detail={"code": code, "message": message})


def validate_credentials(email: str, password: str) -> str:
    email = (email or "").strip().lower()
    if not _EMAIL.match(email) or len(email) > 254:
        raise api_error(400, "invalid_email", "Enter a valid email address.")
    if len(password or "") < MIN_PASSWORD:
        raise api_error(400, "weak_password", f"Password must be at least {MIN_PASSWORD} characters.")
    if len(password) > 72:
        raise api_error(400, "weak_password", "Password must be 72 characters or fewer.")
    return email


def _supabase_message(resp: httpx.Response, fallback: str) -> tuple[str, str]:
    try:
        body = resp.json()
    except ValueError:
        return "auth_error", fallback
    code = body.get("error_code") or body.get("error") or "auth_error"
    msg = body.get("msg") or body.get("message") or body.get("error_description") or fallback
    return str(code), str(msg)


def session_from(body: dict) -> dict:
    user = body.get("user") or {}
    return {"access_token": body["access_token"], "refresh_token": body.get("refresh_token"),
            "expires_in": body.get("expires_in"), "user": {"id": user.get("id"), "email": user.get("email")}}


async def supabase_call(request: Request, method: str, path: str, **kw) -> httpx.Response:
    client = request.app.state.supabase
    if client is None:
        raise api_error(404, "auth_disabled", "Authentication is not enabled on this server.")
    try:
        return await client.request(method, path, **kw)
    except httpx.HTTPError:
        raise api_error(503, "auth_unavailable", "Cannot reach the authentication service. Try again shortly.")


# ------------------------------------------------------------ token verification
_cache: dict[str, tuple[float, dict]] = {}


def _key(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()       # never keep raw tokens in memory keys


async def verify_token(request: Request, token: str) -> dict:
    k, now = _key(token), time.time()
    hit = _cache.get(k)
    if hit and hit[0] > now:
        return hit[1]
    resp = await supabase_call(request, "GET", "/auth/v1/user", headers={"Authorization": f"Bearer {token}"})
    if resp.status_code != 200:
        raise api_error(401, "unauthorized", "Your session has expired. Please log in again.")
    body = resp.json()
    user = {"id": body.get("id"), "email": body.get("email")}
    if not user["id"]:
        raise api_error(401, "unauthorized", "Invalid session.")
    if len(_cache) > 2000:
        for old in [x for x, v in _cache.items() if v[0] <= now]:
            _cache.pop(old, None)
        if len(_cache) > 2000:
            _cache.clear()
    _cache[k] = (now + TOKEN_CACHE_SECONDS, user)
    return user


def clear_token_cache() -> None:
    _cache.clear()


async def current_user_info(request: Request) -> dict:
    if not auth_enabled():
        return {"id": DEMO_USER, "email": None}
    header = request.headers.get("authorization", "")
    if not header.lower().startswith("bearer ") or len(header) < 20:
        raise api_error(401, "unauthorized", "Please log in.")
    return await verify_token(request, header[7:].strip())


async def current_user(request: Request) -> str:
    """FastAPI dependency: the id of the logged-in user (or the demo user)."""
    user = await current_user_info(request)

    def _ensure() -> None:
        conn = connection.connect()
        try:
            connection.ensure_user(conn, user["id"])
        finally:
            conn.close()
    await asyncio.to_thread(_ensure)                     # DB call off the event loop (no-op after the first time)
    return user["id"]
