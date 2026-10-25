import os
import pytest

# Empty strings (not "unset"): python-dotenv will NOT overwrite them from a real .env file, so running
# the tests can never touch your real Supabase project or your real API keys.
for _k in ("SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_DB_URL", "ALPHAVANTAGE_API_KEY", "OPENROUTER_API_KEY"):
    os.environ[_k] = ""
os.environ["LLM_MOCK"] = "true"


@pytest.fixture()
def db(tmp_path, monkeypatch):
    monkeypatch.setenv("FINALLY_DB_PATH", str(tmp_path / "test.db"))
    from app.db import connection
    connection.init_db()
    conn = connection.connect()
    connection.ensure_user(conn, connection.DEFAULT_USER)
    yield conn
    conn.close()
