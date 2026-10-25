import pytest
from app.market.cache import PriceCache
from app.market.simulator import SimulatorProvider
from app.portfolio.trades import execute_trade, TradeError
from app.portfolio.valuation import get_portfolio


@pytest.fixture()
def cache():
    c = PriceCache(); SimulatorProvider(c, seed=7)._backfill(); return c


def test_seed_data(db):
    assert db.execute("SELECT cash_balance FROM users_profile").fetchone()[0] == 10000.0
    assert db.execute("SELECT COUNT(*) FROM watchlist").fetchone()[0] == 10


def test_buy_then_partial_then_full_sell(db, cache):
    px = cache.latest("AAPL").price
    r = execute_trade(db, cache, "aapl", "buy", 10)
    assert r["price"] == px and r["cash_balance"] == pytest.approx(10000 - 10 * px)
    execute_trade(db, cache, "AAPL", "sell", 4)
    assert get_portfolio(db, cache)["positions"][0]["quantity"] == pytest.approx(6)
    execute_trade(db, cache, "AAPL", "sell", 6)
    assert get_portfolio(db, cache)["positions"] == []          # row deleted at zero
    assert get_portfolio(db, cache)["cash_balance"] == pytest.approx(10000)
    assert db.execute("SELECT COUNT(*) FROM trades").fetchone()[0] == 3
    assert db.execute("SELECT COUNT(*) FROM portfolio_snapshots").fetchone()[0] == 3


def test_average_cost_on_second_buy(db, cache):
    p1 = cache.latest("MSFT").price
    execute_trade(db, cache, "MSFT", "buy", 5)
    execute_trade(db, cache, "MSFT", "buy", 5)
    assert get_portfolio(db, cache)["positions"][0]["avg_cost"] == pytest.approx(p1)


@pytest.mark.parametrize("args,code", [
    (("ZZZZ", "buy", 1), "unsupported_ticker"),
    (("AAPL", "hold", 1), "invalid_side"),
    (("AAPL", "buy", 0), "invalid_quantity"),
    (("AAPL", "buy", -3), "invalid_quantity"),
    (("AAPL", "buy", 1e9), "insufficient_cash"),
    (("AAPL", "sell", 1), "insufficient_shares"),
])
def test_validation_errors_leave_state_untouched(db, cache, args, code):
    with pytest.raises(TradeError) as e:
        execute_trade(db, cache, *args)
    assert e.value.code == code
    assert get_portfolio(db, cache)["cash_balance"] == 10000.0
    assert db.execute("SELECT COUNT(*) FROM trades").fetchone()[0] == 0


def test_fractional_shares_supported(db, cache):
    execute_trade(db, cache, "NVDA", "buy", 0.5)
    assert get_portfolio(db, cache)["positions"][0]["quantity"] == 0.5
