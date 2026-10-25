# Implementation and release tasks

## Platform
- [x] Next.js App Router setup
- [x] Supabase browser/server/admin client split
- [x] Middleware session refresh
- [x] SQL migration and RLS
- [x] Protected route handlers

## User features
- [x] Signup/login/email confirmation callback
- [x] Watchlist
- [x] Live-provider quotes and candles
- [x] Candlestick chart and OHLC tooltip
- [x] Virtual portfolio and paper trade RPC
- [x] Read-only AI learning assistant
- [x] Admin dashboard and role management

## Release validation (run in configured environment)
- [ ] `npm install`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Apply migration in Supabase and test signup/profile trigger
- [ ] Verify RLS with two separate normal users
- [ ] Verify non-admin gets a 403 from admin API routes
- [ ] Verify provider rate-limit and entitlement errors render clearly
- [ ] Validate virtual buy/sell cash and positions; test insufficient cash and oversell
- [ ] Confirm no live brokerage APIs or secret values are present in browser bundles
- [ ] Deploy to Vercel and test production email callback URLs
