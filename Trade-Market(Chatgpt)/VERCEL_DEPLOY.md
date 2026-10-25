# Vercel release checklist

## Before deploying
- [ ] Run `supabase/migrations/0001_initial_schema.sql` in the target Supabase project.
- [ ] Verify RLS is enabled on all five public tables.
- [ ] Add production redirect URLs in Supabase Auth, including `/auth/callback`.
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Vercel.
- [ ] Add server-only `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Add server-only `TWELVE_DATA_API_KEY` and check market-data plan entitlements.
- [ ] Add `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` only if enabling the optional assistant.
- [ ] Verify that secret values do not use the `NEXT_PUBLIC_` prefix.
- [ ] Deploy with the normal Next.js build; don't enable static export.
- [ ] Create an account and promote only your trusted account to admin via SQL.
- [ ] Test signup, login, sign out, chart tooltip/crosshair, watchlist, and virtual trading checks.
- [ ] Test that a normal user is redirected away from `/admin` and receives 403 from admin API routes.
- [ ] Test that insufficient virtual cash and selling more shares than held are rejected.

## Admin setup SQL

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

## Local verification

```bash
cp .env.example .env.local
# Populate .env.local with your project-specific values.
npm install
npm run typecheck
npm run build
npm run dev
```
