import asyncio
import logging
from ..db import connection
from ..market.cache import PriceCache
from .valuation import total_value

logger = logging.getLogger(__name__)
SNAPSHOT_INTERVAL = 30.0     # seconds (PLAN.md section 7)


def record_snapshots(cache: PriceCache) -> int:
    """One snapshot per user. A user whose value did not change since their last snapshot is skipped,
    which keeps idle accounts from filling the database."""
    conn = connection.connect()
    written = 0
    try:
        users = [r["id"] for r in conn.execute("SELECT id FROM users_profile").fetchall()]
        for uid in users:
            value = total_value(conn, cache, uid)
            last = conn.execute("SELECT total_value FROM portfolio_snapshots WHERE user_id=? "
                                "ORDER BY recorded_at DESC LIMIT 1", (uid,)).fetchone()
            if last is not None and abs(last["total_value"] - value) < 0.005:
                continue
            with conn:
                conn.execute("INSERT INTO portfolio_snapshots (id,user_id,total_value,recorded_at) VALUES (?,?,?,?)",
                             (connection.new_id(), uid, value, connection.now_iso()))
            written += 1
    finally:
        conn.close()
    return written


async def snapshot_loop(cache: PriceCache, interval: float = SNAPSHOT_INTERVAL) -> None:
    while True:
        await asyncio.sleep(interval)
        try:
            await asyncio.to_thread(record_snapshots, cache)    # DB work off the event loop
        except Exception:                                        # a failed snapshot must never kill the task
            logger.exception("snapshot failed")
