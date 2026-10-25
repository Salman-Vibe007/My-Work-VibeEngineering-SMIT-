# Connect FinAlly to Supabase (login + database)

With Supabase connected, people **create an account or log in with email + password** (no Google or Microsoft sign-in), and every user gets their own $10,000 portfolio, watchlist, trades and chat history, stored in your Supabase Postgres database.

```
Browser --(email+password)--> FinAlly backend --> Supabase Auth     (creates/checks accounts)
Browser --(Bearer token)----> FinAlly backend --> Supabase Postgres (each user's data, filtered by user id)
```
The browser never talks to Supabase directly, so your database password never leaves your computer/server.

**Three modes, chosen only by what is in `.env`:**

| `.env` values | Mode |
|---|---|
| all three Supabase values empty | **Demo**: no login, one shared account, local SQLite file |
| `SUPABASE_URL` + `SUPABASE_ANON_KEY` | **Login** required; data still in local SQLite (handy for a first test) |
| all three filled | **Full Supabase**: login + data in your Supabase database (recommended) |

> Dashboard screens and button names change from time to time. If something below does not match, follow the official docs: <https://supabase.com/docs/guides/auth/passwords> and <https://supabase.com/docs/guides/database/connecting-to-postgres>.

## Step 1 - Create the project
1. Sign up at <https://supabase.com/> and click **New project**.
2. Pick a name and a region close to you. Choose a **database password** and save it somewhere safe (you need it in Step 3). Prefer letters and digits; if it has symbols, see the tip in Step 3.
3. Wait until the project finishes setting up.

## Step 2 - Copy the URL and the public key (for login)
In **Project Settings > API** (or the **Connect** dialog) copy:
- **Project URL**, like `https://abcdefgh.supabase.co`  -> `SUPABASE_URL`
- the **anon / publishable key** (the public one)  -> `SUPABASE_ANON_KEY`

Do **not** use the `service_role` / secret key. FinAlly does not need it.

## Step 3 - Copy the database connection string
Click **Connect** (top of the dashboard) > **Connection string** and choose the **Session pooler** (works on normal home internet / IPv4). It looks like:

```
postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres
```
Replace `[YOUR-PASSWORD]` with your database password -> `SUPABASE_DB_URL`.

Tip: if the password contains special characters, URL-encode them (`@` becomes `%40`, `#` becomes `%23`, `/` becomes `%2F`, `:` becomes `%3A`). The **Transaction pooler** (port 6543) also works. The "Direct connection" host often needs IPv6, so avoid it on home networks.

## Step 4 - Set the Auth options
In **Authentication**:
- **Providers**: make sure **Email** is on. Leave Google, Microsoft and all others **off**.
- **Confirm email** (Sign In / Providers > Email): by default Supabase sends a confirmation email and the user must click it before logging in. FinAlly handles both ways:
  - leave it **on** (production): after "Create account" the user sees "Check your email to confirm", then logs in.
  - turn it **off** (quick testing): users are logged in immediately after creating the account.
- **URL Configuration > Site URL**: set `http://localhost:8000` (later your real site address) so confirmation links come back to the app.
- Supabase's built-in email sender is rate-limited and meant for testing. For real users set up your own SMTP in the Auth settings.

## Step 5 - Put the values in `.env`
In the project root (copy `.env.example` to `.env` if you have not yet):
```
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_DB_URL=postgresql://postgres.abcdefgh:YOUR-PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres
```
`.env` is git-ignored. Never commit it, never paste the database password into chat or screenshots.

## Step 6 - Start and test
```bash
cd backend
uv sync
uv run uvicorn app.main:app --port 8000
```
Open <http://localhost:8000>. You should now see the **login screen** instead of the dashboard.
1. Click **Create account**, enter an email and a password of 8+ characters, submit.
2. If confirmation is on, open the email, click the link, then **Log in**.
3. The dashboard opens with your email in the top-right corner and $10,000.00. Buy something.
4. In Supabase: **Authentication > Users** shows your account; **Table Editor** shows six tables (`users_profile`, `watchlist`, `positions`, `trades`, `portfolio_snapshots`, `chat_messages`) and your rows, keyed by your user id. Each table shows Row Level Security enabled.
5. Click **Log out**, log in again: your positions are still there. Create a second account: it starts fresh and cannot see the first user's data.

The app creates the tables itself on first start. If you prefer to create them by hand, paste `supabase/schema.sql` into **SQL Editor** and run it (safe to run twice).

## How security works here
- **Passwords** are handled only by Supabase Auth (stored hashed). FinAlly never stores them.
- Every API request carries the user's access token; the backend verifies it with Supabase (cached for 60 seconds) and uses **that user's id** in every database query, so one user cannot read another's data.
- Tables have **Row Level Security enabled with no policies**, so Supabase's public REST API (reachable with the anon key) cannot read or change them. The backend uses the database password, which is a powerful secret that stays in `.env`.
- Sessions are kept in the browser's `localStorage` so a reload keeps you logged in. That is convenient but can be read by any script running on the page; for a public product consider a cookie-based session.
- The live price stream (`/api/stream/prices`) is public market data and contains no account information.
- Limits to add before going public: login rate limiting, CAPTCHA on sign-up, your own SMTP, HTTPS, and a plan for trimming old `portfolio_snapshots`.

## Troubleshooting
| Problem | Fix |
|---|---|
| Still no login screen | `SUPABASE_URL` is empty or the server was not restarted after editing `.env` |
| `password authentication failed` in the server log | wrong database password, or special characters not URL-encoded |
| `could not translate host name` / connection timeout | you used the Direct connection; use the Session pooler string |
| `/api/health` shows `"database":"sqlite"` | `SUPABASE_DB_URL` is empty |
| "Invalid email or password" right after signing up | email confirmation is on: click the link in the email first |
| No confirmation email arrives | check spam; built-in email is rate-limited; or turn **Confirm email** off while testing |
| "Cannot reach the authentication service" (503) | wrong `SUPABASE_URL`, no internet, or the project is paused (free projects can pause when unused; resume it in the dashboard) |
| 401 on every request after login | `SUPABASE_ANON_KEY` belongs to a different project than `SUPABASE_URL` |
| Old demo trades are missing | demo data lives in `db/finally.db` under the shared `default` user and is not moved into Supabase |

## What was and was not tested (honest status)
- **Tested here:** the SQL, row locking (two simultaneous buys cannot overspend), Row Level Security setup and all API flows on a **real PostgreSQL 16** (the same database engine Supabase runs); sign-up, log-in, refresh, per-user isolation and error handling against a **stand-in Supabase Auth service** that follows the documented endpoints; the browser screens in a simulated browser.
- **Not tested here:** a real Supabase project (this environment cannot reach supabase.co). Pooler connection strings, dashboard labels, email delivery and Supabase's exact error texts are from documentation knowledge. On your first run, tell me any error text you see and I will fix it.
