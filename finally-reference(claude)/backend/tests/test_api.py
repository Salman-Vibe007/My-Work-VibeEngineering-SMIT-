import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("FINALLY_DB_PATH", str(tmp_path / "api.db"))
    monkeypatch.setenv("FINALLY_STATIC_DIR", str(tmp_path / "nostatic"))
    from app.main import app
    with TestClient(app) as c:
        yield c


def test_health_and_defaults(client):
    h = client.get("/api/health").json()
    assert h["status"] == "ok" and h["market_data"] == "SimulatorProvider"
    wl = client.get("/api/watchlist").json()
    assert len(wl) == 10 and all(i["price"] for i in wl)
    p = client.get("/api/portfolio").json()
    assert p["cash_balance"] == 10000 and p["positions"] == [] and p["total_value"] == 10000


def test_history_endpoint(client):
    assert len(client.get("/api/prices/AAPL/history").json()) == 100
    assert client.get("/api/prices/ZZZZ/history").status_code == 404


def test_trade_flow_and_errors(client):
    r = client.post("/api/portfolio/trade", json={"ticker": "AAPL", "quantity": 5, "side": "buy"})
    assert r.status_code == 200 and r.json()["quantity"] == 5
    p = client.get("/api/portfolio").json()
    assert p["positions"][0]["ticker"] == "AAPL" and p["cash_balance"] < 10000
    bad = client.post("/api/portfolio/trade", json={"ticker": "AAPL", "quantity": 999, "side": "sell"})
    assert bad.status_code == 400 and bad.json()["detail"]["code"] == "insufficient_shares"
    assert len(client.get("/api/portfolio/history").json()) >= 1


def test_watchlist_crud(client):
    assert client.delete("/api/watchlist/NFLX").status_code == 204
    assert "NFLX" not in [i["ticker"] for i in client.get("/api/watchlist").json()]
    assert client.post("/api/watchlist", json={"ticker": "ZZZZ"}).status_code == 400
    added = client.post("/api/watchlist", json={"ticker": "nflx"}).json()
    assert "NFLX" in [i["ticker"] for i in added]


def test_chat_mock_executes_trade_via_same_validation(client):
    r = client.post("/api/chat", json={"content": "please buy 3 NVDA"}).json()
    assert r["role"] == "assistant" and r["actions"][0]["success"] is True
    assert client.get("/api/portfolio").json()["positions"][0]["ticker"] == "NVDA"
    r2 = client.post("/api/chat", json={"content": "buy 100000 TSLA"}).json()
    assert r2["actions"][0]["success"] is False                 # rejected, not executed
    history = client.get("/api/chat").json()
    assert [m["role"] for m in history] == ["user", "assistant", "user", "assistant"]


def test_chat_watchlist_action(client):
    r = client.post("/api/chat", json={"content": "remove JPM from my watchlist"}).json()
    assert r["actions"][0]["type"] == "watchlist" and r["actions"][0]["success"]
