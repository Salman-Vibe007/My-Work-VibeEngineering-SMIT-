"""Runs the database code against a REAL PostgreSQL (an embedded one from the `pgserver` package).
Supabase is PostgreSQL, so this checks the same SQL, row locking and Row Level Security setup.
Skipped automatically if pgserver is not installed. It does NOT contact Supabase itself."""
import tempfile
import threading

import pytest

pgserver = pytest.importorskip("pgserver")
from fastapi.testclient import TestClient

from app.db import connection
from app.market.cache import PriceCache
from app.market.simulator import SimulatorProvider
from app.portfolio.trades import TradeError, execute_trade
from app.portfolio.valuation import get_portfolio


@pytest.fixture(scope="module")
def pg_url():
    d = tempfile.mkdtemp()
    srv = pgserver.get_server(d, cleanup_mode="stop")
    yield srv.get_uri()
    connection.close_pools()
    srv.cleanup()


@pytest.fixture()
def pg(pg_url, monkeypatch):
    monkeypatch.setenv("SUPABASE_DB_URL", pg_url)
    connection.forget_users()
    connection.init_db()
    conn = connection.connect()
    with conn:
        for t in connection.TABLES:
            conn.execute(f"DELETE FROM {t}")
    yield conn
    conn.close()


@pytest.fixture()
def cache():
    c = PriceCache(); SimulatorProvider(c, seed=3)._backfill(); return c


def test_mode_and_schema_with_rls(pg):
    assert connection.kind() == "postgres"
    rows = pg.execute("SELECT relname, relrowsecurity FROM pg_class WHERE relname = ANY(?)",
                      (list(connection.TABLES),)).fetchall()
    assert {r["relname"] for r in rows} == set(connection.TABLES)
    assert all(r["relrowsecurity"] for r in rows)                 # RLS on: Supabase's public API can't read them
    connection.init_db()                                          # idempotent second run


def test_ensure_user_seeds_once(pg):
    connection.ensure_user(pg, "user-1"); connection.forget_users(); connection.ensure_user(pg, "user-1")
    assert pg.execute("SELECT COUNT(*) AS n FROM watchlist WHERE user_id=?", ("user-1",)).fetchone()["n"] == 10
    assert pg.execute("SELECT cash_balance FROM users_profile WHERE id=?", ("user-1",)).fetchone()["cash_balance"] == 10000


def test_trade_flow_on_postgres(pg, cache):
    connection.ensure_user(pg, "u1")
    px = cache.latest("AAPL").price
    r = execute_trade(pg, cache, "AAPL", "buy", 10, "u1")
    assert r["price"] == px and r["cash_balance"] == pytest.approx(10000 - 10 * px)
    execute_trade(pg, cache, "AAPL", "sell", 4, "u1")
    assert get_portfolio(pg, cache, "u1")["positions"][0]["quantity"] == pytest.approx(6)
    execute_trade(pg, cache, "AAPL", "sell", 6, "u1")
    assert get_portfolio(pg, cache, "u1")["positions"] == []
    assert pg.execute("SELECT COUNT(*) AS n FROM trades WHERE user_id=?", ("u1",)).fetchone()["n"] == 3
    with pytest.raises(TradeError) as e:
        execute_trade(pg, cache, "AAPL", "buy", 1e9, "u1")
    assert e.value.code == "insufficient_cash"


def test_users_are_separate_on_postgres(pg, cache):
    connection.ensure_user(pg, "u1"); connection.ensure_user(pg, "u2")
    execute_trade(pg, cache, "MSFT", "buy", 5, "u1")
    assert get_portfolio(pg, cache, "u2")["positions"] == [] and get_portfolio(pg, cache, "u2")["cash_balance"] == 10000


def test_simultaneous_trades_cannot_overspend(pg, cache):
    """Two threads each try to spend ~57% of the cash at once. The row lock (FOR UPDATE) must let only one win."""
    connection.ensure_user(pg, "race")
    price = cache.latest("AAPL").price
    qty = (10000 * 0.57) / price
    results, barrier = [], threading.Barrier(2)

    def worker():
        conn = connection.connect()
        try:
            barrier.wait()
            execute_trade(conn, cache, "AAPL", "buy", qty, "race"); results.append("ok")
        except TradeError as e:
            results.append(e.code)
        finally:
            conn.close()
    ts = [threading.Thread(target=worker) for _ in range(2)]
    [t.start() for t in ts]; [t.join() for t in ts]
    assert sorted(results) == ["insufficient_cash", "ok"]
    assert get_portfolio(pg, cache, "race")["cash_balance"] > 0


def test_full_api_on_postgres(pg_url, tmp_path, monkeypatch):
    monkeypatch.setenv("SUPABASE_DB_URL", pg_url); monkeypatch.setenv("SUPABASE_URL", "")
    monkeypatch.setenv("FINALLY_STATIC_DIR", str(tmp_path / "x"))
    connection.forget_users()
    from app.main import app
    with TestClient(app) as c:
        assert c.get("/api/health").json()["database"] == "postgres"
        assert c.post("/api/portfolio/trade", json={"ticker": "NVDA", "quantity": 2, "side": "buy"}).status_code == 200
        chat = c.post("/api/chat", json={"content": "buy 1 TSLA"}).json()
        assert chat["actions"][0]["success"] is True
        p = c.get("/api/portfolio").json()
        assert {x["ticker"] for x in p["positions"]} == {"NVDA", "TSLA"}
        assert len(c.get("/api/chat").json()) == 2
        assert len(c.get("/api/portfolio/history").json()) >= 2
        assert c.delete("/api/watchlist/NFLX").status_code == 204
        assert len(c.get("/api/watchlist").json()) == 9
