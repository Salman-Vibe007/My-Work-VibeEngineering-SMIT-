# Shared instructions for coding agents

The project contract is in `planning/PLAN.md` and `planning/API_CONTRACT.md`. Use them as the single source of truth.

## Agent ownership suggestions
- Planner/reviewer: planning docs, acceptance criteria, risk review.
- Supabase engineer: `supabase/migrations/**`, `lib/supabase/**`, auth and API policy review.
- Market-data engineer: `lib/market-data.ts`, `/api/market/**`.
- Frontend engineer: `components/**`, `app/globals.css`, client-side interaction.
- Integration engineer: route handlers, session checks, server-side validations.
- QA engineer: read-only review, static checks, and test plans.

## Handoff rules
- Do not have multiple agents edit the same file simultaneously.
- Do not rewrite the API contract without updating all consumers and tests.
- Do not work around RLS using a service-role key in client components.
- Ask for review before changing database privileges or security-definer functions.
- Preserve the virtual-only trading boundary.
