import json
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from ..auth import current_user
from ..chat.actions import execute_actions
from ..chat.context import build_messages
from ..chat.llm import call_llm
from ..db import connection

router = APIRouter(prefix="/chat")


class ChatIn(BaseModel):
    content: str


def _row(r) -> dict:
    return {"id": r["id"], "role": r["role"], "content": r["content"],
            "actions": json.loads(r["actions"]) if r["actions"] else None, "created_at": r["created_at"]}


@router.get("")
def history(user_id: str = Depends(current_user)):
    conn = connection.connect()
    try:
        rows = conn.execute("SELECT * FROM chat_messages WHERE user_id=? ORDER BY created_at DESC LIMIT 10",
                            (user_id,)).fetchall()
        return [_row(r) for r in reversed(rows)]
    finally:
        conn.close()


@router.post("")
def send(body: ChatIn, request: Request, user_id: str = Depends(current_user)):
    cache = request.app.state.price_cache
    conn = connection.connect()
    try:
        messages = build_messages(conn, cache, body.content, user_id)     # this user's context + last 10 messages
        with conn:
            conn.execute("INSERT INTO chat_messages (id,user_id,role,content,actions,created_at) "
                         "VALUES (?,?,?,?,?,?)", (connection.new_id(), user_id, "user",
                                                  body.content, None, connection.now_iso()))
        llm_resp = call_llm(messages)                                      # blocking SDK call; we are in a worker thread
        actions = execute_actions(conn, cache, llm_resp, user_id)          # same validation as manual trades
        msg = {"id": connection.new_id(), "role": "assistant", "content": llm_resp.message,
               "actions": actions or None, "created_at": connection.now_iso()}
        with conn:
            conn.execute("INSERT INTO chat_messages (id,user_id,role,content,actions,created_at) "
                         "VALUES (?,?,?,?,?,?)", (msg["id"], user_id, "assistant", msg["content"],
                                                  json.dumps(actions) if actions else None, msg["created_at"]))
        return msg
    finally:
        conn.close()
