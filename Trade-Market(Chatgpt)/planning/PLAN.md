# FinAlly implementation plan

## Vision
Build a polished, responsive educational market workstation for learning how prices, charts, watchlists, and a simulated portfolio fit together. It uses real market data through a provider adapter while keeping all portfolio transactions virtual.

## Main user stories
1. A visitor can create an account, confirm email if enabled, log in, and sign out.
2. Each account has its own watchlist, $10,000 virtual cash account, positions, and trade ledger.
3. Authenticated users can inspect current provider quotes and historical OHLC candles.
4. The price chart supports 1D/1W/1M/3M/1Y periods, crosshair, candle hover indicator, timestamp, and OHLC tooltip.
5. Authenticated users can add/remove watchlist symbols.
6. Users can submit a simulated buy/sell. The server fetches the quote, validates quantity, and uses an atomic Postgres function for virtual cash/position changes.
7. The AI learning assistant can explain supplied market context and general concepts but cannot trade or issue executable trading instructions.
8. Administrators can see aggregate usage, recent virtual trades, and change profile roles using a protected admin API.
9. The application can be deployed on Vercel with Supabase as persistent storage and authentication.

## Non-goals
- Brokerage connections, exchange order routing, real-money trading, deposits, withdrawals, real portfolios, or custody.
- Personalized investment advice, return guarantees, or automated buy/sell recommendations.
- Fake/mock prices presented as live.
- Public display of private user information or admin metrics.

## Architecture
- Next.js App Router + TypeScript: frontend and backend route handlers.
- Supabase Auth: cookie-managed SSR sessions with `@supabase/ssr`.
- Supabase Postgres: profiles, watchlists, virtual cash accounts, positions, paper trades.
- RLS: restrict user-visible rows to `auth.uid()`; profiles do not allow self-updating role.
- Server-only service-role client: only in backend routes, only after admin checks or after user verification for atomic trade RPC.
- Twelve Data provider adapter: quote and candle API calls on the server; provider entitlements determine delay and coverage.
- Lightweight Charts: candlestick interaction and OHLC hover tooltip.
- Optional OpenAI-compatible endpoint: read-only explainers.
- Vercel: production app runtime; don't use static export.

## Key invariants
- Do not trust a browser-submitted price.
- Do not render fabricated market prices as current.
- Simulated trade execution is one database transaction.
- Supabase secret/service-role, market-data, and AI keys are server-only.
- The trade RPC is not executable by ordinary authenticated clients; only the server-side service role invokes it after session verification.
- Every admin route verifies the caller's role using their session-scoped client before using the service role.

## Acceptance criteria
- [ ] Signup/login/callback/session refresh work with a configured Supabase project.
- [ ] RLS protects every user's profile, account, watchlist, positions, and trades.
- [ ] First signup receives a profile, starter watchlist, and $10,000 virtual cash.
- [ ] Real quote/candle routes return provider data or visible actionable errors; no fake-price fallback.
- [ ] Chart period controls, crosshair, tooltip, and hover values work.
- [ ] Valid paper buys/sells update cash, position quantity/average price, and trade history atomically.
- [ ] Insufficient virtual cash, overselling, invalid symbols/quantities, and unavailable quotes are rejected.
- [ ] AI assistant has no tools and cannot execute trades.
- [ ] Non-admin access to admin page/API is denied.
- [ ] Project builds with `npm run build` after dependency installation and proper configuration.
- [ ] Vercel environment variables and Supabase redirect URLs are documented.
