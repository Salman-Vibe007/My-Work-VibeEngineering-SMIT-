"""LLM call via LiteLLM -> OpenRouter -> Cerebras (follows .claude/skills/cerebras/SKILL.md)."""
import logging
import os
import re
from typing import Literal
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


class TradeAction(BaseModel):
    ticker: str
    side: Literal["buy", "sell"]
    quantity: float


class WatchlistChange(BaseModel):
    ticker: str
    action: Literal["add", "remove"]


class LLMResponse(BaseModel):
    """Structured output schema (PLAN.md section 9)."""
    message: str
    trades: list[TradeAction] = Field(default_factory=list)
    watchlist_changes: list[WatchlistChange] = Field(default_factory=list)


def mock_response(user_text: str) -> LLMResponse:
    """Deterministic replacement used when LLM_MOCK=true (E2E tests, CI, no API key)."""
    text = user_text.lower()
    trade = re.search(r"\b(buy|sell)\s+(\d+(?:\.\d+)?)\s+([a-z]{1,5})\b", text)
    wl = re.search(r"\b(add|remove)\s+([a-z]{1,5})\b.*\bwatchlist\b", text)
    resp = LLMResponse(message="Mock FinAlly: your portfolio looks balanced.")
    if trade:
        side, qty, tkr = trade.groups()
        resp.message = f"Mock FinAlly: executing {side} of {qty} {tkr.upper()}."
        resp.trades = [TradeAction(ticker=tkr.upper(), side=side, quantity=float(qty))]
    elif wl:
        action, tkr = wl.groups()
        resp.message = f"Mock FinAlly: {action} {tkr.upper()} on your watchlist."
        resp.watchlist_changes = [WatchlistChange(ticker=tkr.upper(), action=action)]
    return resp


def call_llm(messages: list[dict]) -> LLMResponse:
    if os.getenv("LLM_MOCK", "false").lower() == "true":
        last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        return mock_response(last_user)
    from litellm import completion          # imported lazily: not needed in mock mode / unit tests
    try:
        response = completion(model=MODEL, messages=messages, response_format=LLMResponse,
                              reasoning_effort="low", extra_body=EXTRA_BODY)
        return LLMResponse.model_validate_json(response.choices[0].message.content)
    except Exception:                        # network, auth, or malformed JSON: degrade gracefully
        logger.exception("LLM call failed")
        return LLMResponse(message="Sorry, I couldn't reach the AI model just now. "
                                   "Please try again in a moment.")
