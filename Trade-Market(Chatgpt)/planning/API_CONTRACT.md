# API contract

All `/api/*` routes below require a valid Supabase session unless explicitly stated otherwise. Routes use JSON responses and return `{ "error": "..." }` on failure.

## Market data
- `GET /api/market/quote?symbol=AAPL` -> `{ symbol, name, price, change, percentChange, timestamp, currency, exchange, source }`
- `GET /api/market/candles?symbol=AAPL&period=1M` -> `{ candles: [{ time, open, high, low, close, volume }], interval, provider }`
- Supported periods: `1D`, `1W`, `1M`, `3M`, `1Y`.

## Watchlist
- `GET /api/watchlist` -> `{ watchlist: [{ symbol, created_at }] }`; seeds five defaults if empty.
- `POST /api/watchlist` body `{ symbol }` -> `{ symbol }`.
- `DELETE /api/watchlist?symbol=AAPL` -> `{ success: true }`.

## Portfolio and trades
- `GET /api/portfolio` -> `{ account, positions, trades }`.
- `POST /api/trades` body `{ symbol, side: "buy" | "sell", quantity }` -> `{ result, quote, message }`.
- The server fetches the current provider quote and invokes `public.execute_paper_trade` using its server-only service-role client. The client never supplies price. The RPC performs all balance/position mutations in one transaction.

## AI assistant
- `POST /api/assistant` body `{ message, symbol }` -> `{ answer, source, quoteTimestamp }`.
- Optional provider requires `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`. No tool calling; no trading actions.

## Admin
- `GET /api/admin/overview` -> `{ metrics, users, recentTrades }`.
- `GET /api/admin/users` -> `{ users }`.
- `PATCH /api/admin/users/:id/role` body `{ role: "user" | "admin" }` -> `{ user }`.
- Admin routes must use `requireApiAdmin()` before service-role queries. An admin cannot alter their own role from the UI.
