"""Database access that works on SQLite (local/demo) and on Supabase PostgreSQL.

Mode is chosen by one env var:
  SUPABASE_DB_URL set   -> PostgreSQL (Supabase), via a connection pool
  SUPABASE_DB_URL empty -> SQLite file (db/finally.db)
All SQL in the app is written with `?` placeholders; the Postgres wrapper converts them to `%s`.
"""
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from ..market.types import TICKER_UNIVERSE

PROJECT_ROOT = Path(__file__).resolve().parents[3]      # backend/app/db -> project root
SCHEMA_PATH = Path(__file__).with_name("schema.sql")
DEFAULT_USER = "default"
START_CASH = 10_000.0
TABLES = ("users_profile", "watchlist", "positions", "trades", "portfolio_snapshots", "chat_messages")


def database_url() -> str:
    return os.getenv("SUPABASE_DB_URL", "").strip()


def kind() -> str:
    return "postgres" if database_url() else "sqlite"


def for_update() -> str:
    """Row lock suffix: stops two simultaneous trades for one user from overspending cash."""
    return " FOR UPDATE" if kind() == "postgres" else ""


def db_path() -> Path:
    return Path(os.getenv("FINALLY_DB_PATH", PROJECT_ROOT / "db" / "finally.db"))


def location() -> str:
    return database_url() if kind() == "postgres" else str(db_path())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------- PostgreSQL
def _dsn() -> str:
    dsn = database_url()
    local = "host=/" in dsn or "localhost" in dsn or "127.0.0.1" in dsn
    if "sslmode" not in dsn and not local:               # Supabase requires TLS
        dsn += ("&" if "?" in dsn else "?") + "sslmode=require"
    return dsn


_pools: dict[str, object] = {}
_pool_lock = threading.Lock()


def _pool():
    dsn = _dsn()
    with _pool_lock:
        if dsn not in _pools:
            from psycopg.rows import dict_row
            from psycopg_pool import ConnectionPool
            # prepare_threshold=None: required by Supabase's transaction pooler (port 6543)
            _pools[dsn] = ConnectionPool(dsn, min_size=1, max_size=int(os.getenv("DB_POOL_MAX", "5")),
                                         kwargs={"row_factory": dict_row, "prepare_threshold": None},
                                         open=True, timeout=15)
        return _pools[dsn]


def close_pools() -> None:
    with _pool_lock:
        for p in _pools.values():
            p.close()
        _pools.clear()


class PgConn:
    """Mimics the small part of sqlite3.Connection the app uses: execute(), `with` (commit/rollback), close()."""

    def __init__(self) -> None:
        self._pool = _pool()
        self._conn = self._pool.getconn()

    def execute(self, sql: str, params=()):
        cur = self._conn.cursor()
        cur.execute(sql.replace("?", "%s"), tuple(params))
        return cur

    def __enter__(self):
        return self

    def __exit__(self, et, ev, tb):
        if et is None:
            self._conn.commit()
        else:
            self._conn.rollback()
        return False

    def close(self) -> None:
        try:
            self._conn.rollback()                         # end any open read-only transaction
        finally:
            self._pool.putconn(self._conn)


# ---------------------------------------------------------------- public API
def connect():
    if kind() == "postgres":
        return PgConn()
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def _statements() -> list[str]:
    out = []
    for chunk in SCHEMA_PATH.read_text().split(";"):
        lines = [l for l in chunk.splitlines() if l.strip() and not l.strip().startswith("--")]
        if lines:
            out.append("\n".join(lines))
    return out


def init_db() -> None:
    """Idempotent: create tables/indexes. On Postgres also turn on Row Level Security (no policies)
    so Supabase's public REST API (anon key) cannot read these tables; only this backend can."""
    conn = connect()
    try:
        if kind() == "postgres":
            with conn:
                for stmt in _statements():
                    conn.execute(stmt)
                for t in TABLES:
                    conn.execute(f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY")
        else:
            conn.executescript(SCHEMA_PATH.read_text())
            conn.commit()
    finally:
        conn.close()


_known_users: set[tuple[str, str]] = set()


def ensure_user(conn, user_id: str) -> None:
    """First time we see a user: $10,000 cash and the default 10-ticker watchlist (idempotent)."""
    key = (location(), user_id)
    if key in _known_users:
        return
    with conn:
        conn.execute("INSERT INTO users_profile (id, cash_balance, created_at) VALUES (?,?,?) "
                     "ON CONFLICT (id) DO NOTHING", (user_id, START_CASH, now_iso()))
        for t in TICKER_UNIVERSE:
            conn.execute("INSERT INTO watchlist (id, user_id, ticker, added_at) VALUES (?,?,?,?) "
                         "ON CONFLICT (user_id, ticker) DO NOTHING", (new_id(), user_id, t, now_iso()))
    _known_users.add(key)


def forget_users() -> None:
    _known_users.clear()
