"""A tiny stand-in for Supabase Auth (GoTrue) so auth can be tested without a Supabase project.
It implements only the endpoints this backend calls: signup, token (password + refresh), user.
Run live:  uvicorn tests.fake_supabase:app --port 9099   (set FAKE_CONFIRM_EMAIL=1 to require confirmation)"""
import os
import uuid
from fastapi import FastAPI, Header, Request
from fastapi.responses import JSONResponse

app = FastAPI()
USERS: dict[str, dict] = {}
TOKENS: dict[str, str] = {}
REFRESH: dict[str, str] = {}
CALLS = {"user": 0}
STATE = {"confirm": os.getenv("FAKE_CONFIRM_EMAIL") == "1"}


def err(status, code, msg):
    return JSONResponse({"code": status, "error_code": code, "msg": msg}, status_code=status)


def issue(email):
    at, rt = "at_" + uuid.uuid4().hex, "rt_" + uuid.uuid4().hex
    TOKENS[at], REFRESH[rt] = email, email
    u = USERS[email]
    return {"access_token": at, "refresh_token": rt, "expires_in": 3600, "token_type": "bearer",
            "user": {"id": u["id"], "email": email}}


@app.post("/auth/v1/signup")
async def signup(request: Request, apikey: str | None = Header(default=None)):
    if not apikey:
        return err(401, "no_api_key", "No API key found in request")
    b = await request.json()
    email, pw = b.get("email"), b.get("password", "")
    if len(pw) < 6:
        return err(422, "weak_password", "Password should be at least 6 characters.")
    if email in USERS:
        return err(422, "user_already_exists", "User already registered")
    USERS[email] = {"id": str(uuid.uuid4()), "password": pw, "confirmed": not STATE["confirm"]}
    if STATE["confirm"]:
        return {"id": USERS[email]["id"], "email": email}
    return issue(email)


@app.post("/auth/v1/token")
async def token(request: Request, grant_type: str, apikey: str | None = Header(default=None)):
    if not apikey:
        return err(401, "no_api_key", "No API key found in request")
    b = await request.json()
    if grant_type == "refresh_token":
        email = REFRESH.get(b.get("refresh_token"))
        return issue(email) if email else err(400, "refresh_token_not_found", "Invalid Refresh Token")
    u = USERS.get(b.get("email"))
    if not u or u["password"] != b.get("password"):
        return err(400, "invalid_credentials", "Invalid login credentials")
    if not u["confirmed"]:
        return err(400, "email_not_confirmed", "Email not confirmed")
    return issue(b["email"])


@app.get("/auth/v1/user")
async def user(authorization: str | None = Header(default=None), apikey: str | None = Header(default=None)):
    CALLS["user"] += 1
    email = TOKENS.get((authorization or "").replace("Bearer ", ""))
    if not email:
        return err(401, "bad_jwt", "invalid JWT")
    return {"id": USERS[email]["id"], "email": email}


@app.post("/_confirm_all")
async def confirm_all():
    for u in USERS.values():
        u["confirmed"] = True
    return {"ok": True}
