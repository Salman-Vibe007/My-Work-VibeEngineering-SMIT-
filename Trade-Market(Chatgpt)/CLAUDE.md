# FinAlly — Finance Ally

This repository is an educational paper-trading workstation. Read `planning/PLAN.md` and `planning/API_CONTRACT.md` before changing implementation.

## Non-negotiable constraints
- Real provider market data may be displayed; all ledger transactions remain simulated using virtual cash.
- Never add brokerage integrations, live order endpoints, real deposits/withdrawals, or any execution of real-money trades.
- Never fabricate market prices. If provider credentials or entitlements are missing, display a clear error.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `TWELVE_DATA_API_KEY`, or `AI_API_KEY` to browser code or logs.
- Regular user data must be protected by Supabase RLS. Verify admin role server-side before using the service-role client.
- The AI assistant is read-only and educational. It cannot execute or automatically propose executable trades.

## Workflow
1. Restate the task and list owned files.
2. Check the planning docs and existing API contract.
3. Make the smallest coherent change.
4. Run `npm run typecheck`, `npm run lint`, and `npm run build` when dependencies are available.
5. Review RLS, auth checks, API error handling, and secrets in every change.
6. Summarize files changed, validations that were actually run, and remaining risks. Never claim tests passed unless they were run.
