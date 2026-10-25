import asyncio
import json
import logging

import httpx
import pytest

from app.market.alphavantage import AlphaVantageProvider
from app.market.cache import PriceCache
from app.market.fallback import FallbackProvider
from app.market.types import TICKER_UNIVERSE, Direction

KEY = "SECRETKEY123"


def quote(symbol, price="191.50", prev="190.00"):
    return {"Global Quote": {"01. symbol": symbol, "05. price": price, "07. latest trading day": "2026-10-23",
                             "08. previous close": prev, "09. change": "1.5", "10. change percent": "0.79%"}}


def make(tmp_path, handler, **kw):
    cache = PriceCache()
    client = httpx.AsyncClient(base_url="https://www.alphavantage.co", transport=httpx.MockTransport(handler))
    kw.setdefault("fast_delay", 0.01); kw.setdefault("steady_delay", 0.01); kw.setdefault("daily_limit", 1000)
    return cache, AlphaVantageProvider(cache, client, KEY, tmp_path / "av.json", **kw)


def ok_handler(request):
    return httpx.Response(200, json=quote(request.url.params["symbol"]))


def run(coro):
    return asyncio.run(coro)


def test_parses_quote_and_seeds_two_history_points(tmp_path):
    async def go():
        cache, p = make(tmp_path, ok_handler)
        assert await p.fetch_one("AAPL") == "ok"; await p.stop()
        return cache
    cache = run(go())
    t = cache.latest("AAPL")
    assert t.price == 191.5 and t.change == pytest.approx(1.5) and t.change_percent == pytest.approx(0.789, abs=0.01)
    assert [x.price for x in cache.history("AAPL")][:1] == [190.0] and len(cache.history("AAPL")) == 2   # prev close, then now


def test_request_uses_global_quote_with_key_param(tmp_path):
    seen = []
    def handler(request):
        seen.append(dict(request.url.params)); return ok_handler(request)
    async def go():
        _, p = make(tmp_path, handler); await p.fetch_one("MSFT"); await p.stop()
    run(go())
    assert seen[0] == {"function": "GLOBAL_QUOTE", "symbol": "MSFT", "apikey": KEY}


def test_round_robin_covers_all_ten_tickers_oldest_first(tmp_path):
    async def go():
        cache, p = make(tmp_path, ok_handler)
        await p.start(); await asyncio.sleep(0.6); await p.stop(); return cache, p
    cache, p = run(go())
    assert all(cache.latest(t) for t in TICKER_UNIVERSE)
    assert p.requests_made >= 10


def test_daily_budget_is_respected(tmp_path):
    async def go():
        _, p = make(tmp_path, ok_handler, daily_limit=3)
        await p.start(); await asyncio.sleep(0.5); await p.stop(); return p.requests_made
    assert run(go()) == 3


def test_saved_prices_and_budget_survive_restart(tmp_path):
    async def first():
        _, p = make(tmp_path, ok_handler, daily_limit=4)
        await p.start(); await asyncio.sleep(0.4); await p.stop(); return p.requests_made
    assert run(first()) == 4
    def no_network(request): raise AssertionError("must not call the network: budget already used")
    async def second():
        cache, p = make(tmp_path, no_network, daily_limit=4)
        await p.start(); await asyncio.sleep(0.2); await p.stop(); return cache, p
    cache, p = run(second())
    assert sum(1 for t in TICKER_UNIVERSE if cache.latest(t)) == 4          # restored instantly from the file
    assert p.requests_made == 0 and json.loads((tmp_path / "av.json").read_text())["used"] == 4


def test_invalid_key_is_fatal(tmp_path):
    msg = {"Error Message": "the parameter apikey is invalid or missing."}
    async def go():
        _, p = make(tmp_path, lambda r: httpx.Response(200, json=msg))
        await p.start(); await asyncio.sleep(0.2); await p.stop(); return p
    p = run(go())
    assert p.fatal_error and "rejected" in p.fatal_error and not p.is_healthy


def test_limit_message_backs_off_but_keeps_saved_prices(tmp_path):
    calls = {"n": 0}
    def handler(request):
        calls["n"] += 1
        if calls["n"] == 1: return ok_handler(request)
        return httpx.Response(200, json={"Information": "Our standard API rate limit is 25 requests per day."})
    async def go():
        cache, p = make(tmp_path, handler, quota_backoff=30)
        await p.start(); await asyncio.sleep(0.3); await p.stop(); return cache, p
    cache, p = run(go())
    assert p.fatal_error is None and p.is_healthy and calls["n"] == 2        # second call hit the limit, then it waited
    assert sum(1 for t in TICKER_UNIVERSE if cache.latest(t)) == 1


def test_limit_with_no_saved_prices_is_fatal_so_fallback_can_take_over(tmp_path):
    async def go():
        _, p = make(tmp_path, lambda r: httpx.Response(200, json={"Information": "rate limit reached"}))
        await p.start(); await asyncio.sleep(0.2); await p.stop(); return p
    assert "no saved prices" in run(go()).fatal_error


def test_unknown_symbol_is_skipped(tmp_path):
    async def go():
        _, p = make(tmp_path, lambda r: httpx.Response(200, json={"Global Quote": {}}))
        r = await p.fetch_one("AAPL"); await p.stop(); return r, p.fatal_error
    assert run(go()) == ("skip", None)


def test_api_key_never_appears_in_logs(tmp_path, caplog):
    caplog.set_level(logging.DEBUG)
    def boom(request):
        if request.url.params["symbol"] == "AAPL": return httpx.Response(500)
        raise httpx.ConnectError("cannot connect to " + str(request.url))      # message contains the key URL
    async def go():
        _, p = make(tmp_path, boom)
        await p.fetch_one("AAPL"); await p.fetch_one("MSFT"); await p.stop()
    run(go())
    assert KEY not in caplog.text and "HTTP 500" in caplog.text


def test_fallback_switches_to_simulator_on_fatal(tmp_path):
    async def go():
        cache, p = make(tmp_path, lambda r: httpx.Response(200, json={"Error Message": "the parameter apikey is invalid"}))
        fb = FallbackProvider(cache, p, watch_interval=0.05)
        await fb.start(); await asyncio.sleep(0.6)
        out = (fb.active_name, cache.latest("AAPL") is not None, len(await fb.get_history("AAPL")), fb.is_healthy)
        await fb.stop(); return out
    assert run(go()) == ("SimulatorProvider", True, 100, True)


def test_fallback_keeps_alphavantage_when_it_works(tmp_path):
    async def go():
        cache, p = make(tmp_path, ok_handler)
        fb = FallbackProvider(cache, p, watch_interval=0.05)
        await fb.start(); await asyncio.sleep(0.4)
        out = (fb.active_name, cache.latest("AAPL").price); await fb.stop(); return out
    assert run(go()) == ("AlphaVantageProvider", 191.5)


def test_provider_selection_from_env(monkeypatch, tmp_path):
    from app.market import get_market_data_provider
    cache = PriceCache()
    assert type(get_market_data_provider(cache)).__name__ == "SimulatorProvider"
    monkeypatch.setenv("ALPHAVANTAGE_API_KEY", "abc"); monkeypatch.setenv("ALPHAVANTAGE_CACHE_FILE", str(tmp_path / "c.json"))
    fb = get_market_data_provider(cache)
    assert type(fb).__name__ == "FallbackProvider" and fb.active_name == "AlphaVantageProvider"
