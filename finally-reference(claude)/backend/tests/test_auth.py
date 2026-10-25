import httpx
import pytest
from fastapi.testclient import TestClient

from tests import fake_supabase as fake


@pytest.fixture()
def env(tmp_path, monkeypatch):
    monkeypatch.setenv("FINALLY_DB_PATH", str(tmp_path / "auth.db"))
    monkeypatch.setenv("FINALLY_STATIC_DIR", str(tmp_path / "nostatic"))
    monkeypatch.setenv("SUPABASE_URL", "http://fake.supabase.test")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "test-anon-key")
    fake.USERS.clear(); fake.TOKENS.clear(); fake.REFRESH.clear(); fake.CALLS["user"] = 0; fake.STATE["confirm"] = False
    from app import auth
    auth.clear_token_cache()


def make_client(handler=None):
    transport = httpx.MockTransport(handler) if handler else httpx.ASGITransport(app=fake.app)
    return httpx.AsyncClient(transport=transport, base_url="http://fake.supabase.test", headers={"apikey": "test-anon-key"})


@pytest.fixture()
def client(env):
    from app.main import app
    with TestClient(app) as c:
        app.state.supabase = make_client()
        yield c


def signup(c, email="a@example.com", pw="password123"):
    return c.post("/api/auth/signup", json={"email": email, "password": pw})


def hdr(session):
    return {"Authorization": "Bearer " + session["access_token"]}


def test_config_reports_auth_required(client):
    assert client.get("/api/config").json() == {"auth_required": True, "providers": ["email"]}
    assert client.get("/api/health").json()["auth"] == "supabase"


def test_data_endpoints_need_a_token(client):
    for path in ("/api/portfolio", "/api/watchlist", "/api/chat", "/api/portfolio/history"):
        r = client.get(path)
        assert r.status_code == 401 and r.json()["detail"]["code"] == "unauthorized", path
    assert client.get("/api/portfolio", headers={"Authorization": "Bearer nonsense-token-value"}).status_code == 401


def test_signup_validation(client):
    assert signup(client, "not-an-email").json()["detail"]["code"] == "invalid_email"
    r = signup(client, "a@example.com", "short")
    assert r.status_code == 400 and r.json()["detail"]["code"] == "weak_password"
    assert fake.USERS == {}                                    # nothing reached Supabase


def test_signup_then_use_api_and_me(client):
    r = signup(client); assert r.status_code == 200
    s = r.json(); assert s["user"]["email"] == "a@example.com" and s["access_token"]
    p = client.get("/api/portfolio", headers=hdr(s)).json()
    assert p["cash_balance"] == 10000 and p["positions"] == []
    assert len(client.get("/api/watchlist", headers=hdr(s)).json()) == 10
    assert client.get("/api/auth/me", headers=hdr(s)).json()["email"] == "a@example.com"


def test_duplicate_signup_conflict(client):
    signup(client)
    r = signup(client)
    assert r.status_code == 409 and r.json()["detail"]["code"] == "user_already_exists"


def test_login_ok_and_wrong_password(client):
    signup(client)
    bad = client.post("/api/auth/login", json={"email": "a@example.com", "password": "wrong-password"})
    assert bad.status_code == 401 and bad.json()["detail"]["message"] == "Invalid email or password."
    ok = client.post("/api/auth/login", json={"email": "A@Example.com ", "password": "password123"})
    assert ok.status_code == 200 and ok.json()["access_token"]


def test_two_users_are_isolated(client):
    a = signup(client, "a@example.com").json(); b = signup(client, "b@example.com").json()
    assert a["user"]["id"] != b["user"]["id"]
    t = client.post("/api/portfolio/trade", json={"ticker": "AAPL", "quantity": 5, "side": "buy"}, headers=hdr(a))
    assert t.status_code == 200
    assert client.delete("/api/watchlist/NFLX", headers=hdr(a)).status_code == 204
    client.post("/api/chat", json={"content": "buy 2 MSFT"}, headers=hdr(a))
    pa = client.get("/api/portfolio", headers=hdr(a)).json(); pb = client.get("/api/portfolio", headers=hdr(b)).json()
    assert {x["ticker"] for x in pa["positions"]} == {"AAPL", "MSFT"} and pa["cash_balance"] < 10000
    assert pb["positions"] == [] and pb["cash_balance"] == 10000
    assert len(client.get("/api/watchlist", headers=hdr(a)).json()) == 9
    assert len(client.get("/api/watchlist", headers=hdr(b)).json()) == 10
    assert client.get("/api/chat", headers=hdr(b)).json() == []
    assert len(client.get("/api/chat", headers=hdr(a)).json()) == 2
    assert client.get("/api/portfolio/history", headers=hdr(b)).json() == []


def test_refresh_flow(client):
    s = signup(client).json()
    r = client.post("/api/auth/refresh", json={"refresh_token": s["refresh_token"]})
    assert r.status_code == 200 and r.json()["access_token"] != s["access_token"]
    bad = client.post("/api/auth/refresh", json={"refresh_token": "rt_nope"})
    assert bad.status_code == 401 and bad.json()["detail"]["code"] == "session_expired"


def test_email_confirmation_mode(client):
    fake.STATE["confirm"] = True
    r = signup(client).json()
    assert r["confirm_email"] is True and "access_token" not in r
    blocked = client.post("/api/auth/login", json={"email": "a@example.com", "password": "password123"})
    assert blocked.status_code == 401 and "not confirmed" in blocked.json()["detail"]["message"].lower()
    for u in fake.USERS.values(): u["confirmed"] = True
    assert client.post("/api/auth/login", json={"email": "a@example.com", "password": "password123"}).status_code == 200


def test_token_check_is_cached(client):
    s = signup(client).json()
    for _ in range(5):
        client.get("/api/portfolio", headers=hdr(s))
    assert fake.CALLS["user"] == 1                              # Supabase asked once, then cached for 60 s


def test_auth_service_down_returns_503(env):
    from app.main import app
    def boom(request): raise httpx.ConnectError("down")
    with TestClient(app) as c:
        app.state.supabase = make_client(boom)
        r = c.post("/api/auth/login", json={"email": "a@example.com", "password": "password123"})
        assert r.status_code == 503 and r.json()["detail"]["code"] == "auth_unavailable"
        assert c.get("/api/portfolio", headers={"Authorization": "Bearer abcdefghijklmnopqrstuvwxyz"}).status_code == 503


def test_snapshots_per_user_and_skip_unchanged(client, tmp_path):
    from app.portfolio.snapshots import record_snapshots
    a = signup(client, "a@example.com").json(); b = signup(client, "b@example.com").json()
    client.get("/api/portfolio", headers=hdr(a)); client.get("/api/portfolio", headers=hdr(b))   # accounts are created on first use
    cache = client.app.state.price_cache
    n1 = record_snapshots(cache)                                 # two fresh users, flat value
    n2 = record_snapshots(cache)                                 # nothing changed -> nothing written
    assert n1 == 2 and n2 == 0
    client.post("/api/portfolio/trade", json={"ticker": "TSLA", "quantity": 1, "side": "buy"}, headers=hdr(a))
    assert len(client.get("/api/portfolio/history", headers=hdr(a)).json()) >= 2


def test_demo_mode_has_no_login(tmp_path, monkeypatch):
    monkeypatch.setenv("FINALLY_DB_PATH", str(tmp_path / "demo.db"))
    monkeypatch.setenv("FINALLY_STATIC_DIR", str(tmp_path / "x"))
    monkeypatch.setenv("SUPABASE_URL", "")
    from app.main import app
    with TestClient(app) as c:
        assert c.get("/api/config").json()["auth_required"] is False
        assert c.get("/api/portfolio").status_code == 200
        assert c.post("/api/auth/login", json={"email": "a@b.co", "password": "x" * 8}).status_code == 404
