# Review a FinAlly project document

Review the target document `$ARGUMENTS` against `planning/PLAN.md`, `planning/API_CONTRACT.md`, and `CLAUDE.md`.

1. Check technical consistency with the implemented route handlers and SQL migration.
2. Flag unsupported claims, missing setup prerequisites, ambiguous steps, and inconsistent naming.
3. Check that all market data is labelled according to provider timestamps/entitlements and that no fabricated quote is presented as live.
4. Check the paper-trading-only boundary, Supabase RLS and role separation, server-only secrets, and admin guards.
5. Do not edit application code. Provide findings ranked Critical / High / Medium / Low, include file/page references, and suggest minimal fixes.
