# FinAlly — Live Market Data + Simulated Trading Workstation

A full-stack Next.js app based on the FinAlly capstone guide, adapted for Supabase and Vercel. It includes Supabase email/password authentication, a per-user watchlist, live-provider market quotes and candles, an interactive candlestick chart, a virtual-cash paper portfolio, a read-only AI learning assistant, and a role-protected admin console.

> **Safety boundary:** Market data can be real, but all orders are simulated against virtual cash. There are no brokerage connections, live order endpoints, deposits, withdrawals, or real-money trades. The AI assistant is read-only and educational, not investment advice.

## Stack

- Next.js App Router, React, TypeScript
- Supabase Auth + Postgres + Row Level Security (RLS)
- Twelve Data API for quotes and OHLC candles (the data delay and instrument coverage depend on your provider plan)
- Lightweight Charts v5 for responsive candlesticks, crosshair, selected-candle hover state, and OHLC tooltip
- Optional OpenAI-compatible chat endpoint for the learning assistant
- Vercel for hosting

## Features

- Sign up, sign in, email confirmation callback, and session cookie refresh
- Each account receives $10,000 virtual cash, a starter watchlist, and an isolated portfolio
- Real market quote / history routes that proxy server-side to Twelve Data; the key never enters browser code
- Candlestick period controls: 1D, 1W, 1M, 3M, 1Y
- Crosshair and hover tooltip with open, high, low, close, and timestamp
- Watchlist add/remove
- Simulated buys and sells. The server fetches the provider quote itself and calls an atomic Postgres RPC; client-submitted prices are never trusted
- Read-only AI learning assistant with live quote + current paper position context
- Admin metrics, profile/role list, recent simulated trades, and role management
- User-scoped RLS and a service-role client only within protected admin server routes
- Responsive interface using the requested 60–30–10 direction: 60% light neutral surfaces, 30% deep teal `#1B4543` structure, 10% gold `#F0BE6F` actions. `#B3D0C6` is used as the sage secondary tint.

## 1. Prerequisites

- Node.js 20.9+ (Node 22 is recommended)
- A Supabase project
- A Twelve Data API key for actual market data
- Optional: an OpenAI-compatible API key/model for AI chat
- A Vercel account for deployment

## 2. Configure Supabase

1. Create a project at [Supabase](https://supabase.com/).
2. Open **SQL Editor**.
3. Run the complete migration in `supabase/migrations/0001_initial_schema.sql`.
4. In **Project Settings → API**, copy the project URL and publishable key (older projects may label the public key `anon`).
5. In **Authentication → URL Configuration**, set the site URL to your local app during development (`http://localhost:3000`) and add the relevant redirect URLs, including `http://localhost:3000/auth/callback` and your deployed `https://YOUR-APP.vercel.app/auth/callback` URL.
6. Configure email confirmation settings to suit your Supabase Auth setup. If confirmation is enabled, sign-up tells the user to check their email before logging in.

### Make the first administrator

Signup intentionally creates a `user` role; users cannot update their own role. After creating your account, run this in the Supabase SQL editor, replacing the email with your own account email:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

Only do this for accounts you control. Do not add a public role-change form. The admin UI can promote/demote other profiles after a verified admin session.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and set values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
TWELVE_DATA_API_KEY=YOUR_TWELVE_DATA_API_KEY
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=YOUR_AI_PROVIDER_API_KEY
AI_MODEL=YOUR_MODEL_NAME
```

- `NEXT_PUBLIC_*` values are exposed to the browser by design. The Supabase publishable/anon key is safe to expose only when RLS is correctly configured.
- `SUPABASE_SERVICE_ROLE_KEY`, `TWELVE_DATA_API_KEY`, and `AI_API_KEY` must remain server-only. Never rename them with a `NEXT_PUBLIC_` prefix.
- The AI variables are optional; without them the app explains that the assistant is not configured.
- The market key is required for current provider data and to price simulated trades. If absent, the app shows an explicit setup/error message rather than sample or fabricated market prices.
- Provider plan and exchange entitlements determine real-time versus delayed data, supported symbols, and request limits. Check your Twelve Data account's specific entitlements; the application cannot upgrade those limits.

## 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, verify email if required, then log in. If you change environment values, restart the dev server.

Useful checks:

```bash
npm run typecheck
npm run build
```

## 5. Deploy to Vercel

1. Push this folder to a private or public GitHub repository you control.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected framework as **Next.js**. Do not enable static export; authentication and API routes need the Next.js server runtime.
4. Add all required `.env.example` variables under **Project → Settings → Environment Variables**. Add Supabase URL + publishable key, server service-role key, and Twelve Data key. Add AI variables only if you want the chat feature enabled.
5. Deploy. When Vercel gives you the production URL, add that URL and its `/auth/callback` path to Supabase **Authentication → URL Configuration**. Also set the Supabase Site URL to the production URL.
6. Redeploy after changing Vercel environment variables.
7. Sign up, confirm the email if enabled, log in, check the market feed, and open `/admin` after promoting your own profile via SQL.

Vercel previews and production should each have the right environment variables. Never commit `.env.local` or the service-role key.

## 6. API overview

| Route | Method | Purpose |
|---|---|---|
| `/api/market/quote?symbol=AAPL` | GET | Authenticated live provider quote proxy |
| `/api/market/candles?symbol=AAPL&period=1M` | GET | Authenticated provider OHLC history |
| `/api/watchlist` | GET/POST/DELETE | Per-user watchlist management |
| `/api/portfolio` | GET | User's virtual cash, positions, recent trades |
| `/api/trades` | POST | Server-priced simulated trade; calls atomic database RPC |
| `/api/assistant` | POST | Read-only AI explanation using server-verified quote and own portfolio context |
| `/api/admin/overview` | GET | Admin-only platform metrics and records |
| `/api/admin/users` | GET | Admin-only profile listing |
| `/api/admin/users/:id/role` | PATCH | Admin-only role change, excluding self-role changes |

All protected routes call `auth.getUser()` through the server-side Supabase client. RLS scopes regular user queries. The admin service-role key is used only after the caller's profile role has been checked server-side.

## 7. Market data and chart details

The market data key is used by server routes only. `getQuote` checks for a valid price; `getCandles` converts OHLC values to Unix-second timestamps for Lightweight Charts. Chart tooltips are UI overlays driven by the chart crosshair event; they show the selected candle's timestamp and OHLC values. Quotes refresh approximately every 90 seconds in the browser; response caching is short to reduce provider API usage. Real-time updates are not a guarantee: the provider's plan, exchange permissions, market hours, and rate limits apply.

The default periods map to provider intervals:

| UI period | Provider interval | Requested points |
|---|---|---:|
| 1D | 5-minute | 78 |
| 1W | 30-minute | 100 |
| 1M | 1-day | 30 |
| 3M | 1-day | 90 |
| 1Y | 1-day | 252 |

If your API plan does not support an interval or symbol, the interface shows the provider error; it does not substitute fake data.

## 8. Security notes before production

- Review Supabase RLS policies and Auth redirect settings before public launch.
- Confirm your Vercel service-role key and provider keys are server-only in every environment.
- Add rate limits to public signup and market proxy APIs if usage grows; a managed Redis/Upstash limiter is a good next increment.
- Consider instrument allowlisting, server-side schema validation, request logging without secrets, and abuse monitoring.
- The admin service-role API intentionally returns profile emails only to authorized administrators.
- Do not connect this educational project to a brokerage, add real deposits/withdrawals, or treat AI output as an instruction to invest.

## References

- Supabase Next.js Auth quickstart: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Supabase SSR auth guide: https://supabase.com/docs/guides/auth/server-side
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Twelve Data API docs: https://twelvedata.com/docs
- Lightweight Charts docs: https://tradingview.github.io/lightweight-charts/docs
- Original FinAlly capstone guide: `docs/FinAlly_AI_Agents_Capstone_Guide.md`
