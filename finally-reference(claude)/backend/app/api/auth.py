from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from .. import auth

router = APIRouter()


class Credentials(BaseModel):
    email: str
    password: str


class Refresh(BaseModel):
    refresh_token: str


@router.get("/config")
async def config():
    """Public: tells the frontend whether it must show the login screen."""
    return {"auth_required": auth.auth_enabled(), "providers": ["email"]}


@router.post("/auth/signup")
async def signup(body: Credentials, request: Request):
    email = auth.validate_credentials(body.email, body.password)
    resp = await auth.supabase_call(request, "POST", "/auth/v1/signup", json={"email": email, "password": body.password})
    if resp.status_code >= 400:
        code, msg = auth._supabase_message(resp, "Could not create the account.")
        status = 409 if code in ("user_already_exists", "email_exists") else 400
        raise auth.api_error(status, code, msg)
    data = resp.json()
    if data.get("access_token"):                                  # email confirmation is switched off in Supabase
        return auth.session_from(data)
    return {"confirm_email": True, "message": "Account created. Check your email to confirm it, then log in."}


@router.post("/auth/login")
async def login(body: Credentials, request: Request):
    email = (body.email or "").strip().lower()
    if not email or not body.password:
        raise auth.api_error(400, "invalid_credentials", "Enter your email and password.")
    resp = await auth.supabase_call(request, "POST", "/auth/v1/token", params={"grant_type": "password"},
                                    json={"email": email, "password": body.password})
    if resp.status_code >= 400:
        code, msg = auth._supabase_message(resp, "Login failed.")
        if code == "invalid_credentials":
            msg = "Invalid email or password."
        raise auth.api_error(401 if resp.status_code < 500 else 503, code, msg)
    return auth.session_from(resp.json())


@router.post("/auth/refresh")
async def refresh(body: Refresh, request: Request):
    resp = await auth.supabase_call(request, "POST", "/auth/v1/token", params={"grant_type": "refresh_token"},
                                    json={"refresh_token": body.refresh_token})
    if resp.status_code >= 400:
        raise auth.api_error(401, "session_expired", "Your session has expired. Please log in again.")
    return auth.session_from(resp.json())


@router.get("/auth/me")
async def me(user: dict = Depends(auth.current_user_info)):
    return user
