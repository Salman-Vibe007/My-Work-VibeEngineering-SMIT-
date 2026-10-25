# FinAlly - A to Z Setup (frontend + backend, fully working)

You have one project folder, `finally-reference/`. The **backend** (FastAPI) and the **frontend** (`static/`: HTML, CSS, JavaScript) run as **one server on one port**. FastAPI serves the website at `/` and the data at `/api/*`, so there is nothing to connect by hand and no Node.js or build step is needed.

```
Browser  ->  http://localhost:8000
              |-- /            -> static/index.html (the frontend)
              |-- /api/*       -> REST endpoints (portfolio, trade, watchlist, chat)
              |-- /api/stream/prices -> live prices (SSE)
              '-- db/finally.db -> your data (SQLite, created automatically)
```

> **Two ways to run it.** *Demo mode* (this guide, Steps 1-7): no login, data in a local file, nothing to sign up for. *Login + Supabase mode*: follow Steps 1-6 first, then **SETUP_SUPABASE.md** to add email/password accounts and a cloud database. You choose by what is in `.env`; no code changes.

## Step 1 - Install the tools (once)

| Tool | Why | Windows | macOS / Linux |
|---|---|---|---|
| **uv** (also downloads Python 3.12 for you) | runs the backend | PowerShell: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 \| iex"` | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| **A browser** | the UI | any modern one | any modern one |
| Docker Desktop (optional) | one-command run | <https://docs.docker.com/get-docker/> | same |
| Node.js 20 (optional) | only to run the frontend unit tests | <https://nodejs.org/> | same |

Close and reopen your terminal, then check: `uv --version`.
(If you prefer your own Python: install 3.12+ from <https://www.python.org/downloads/> and tick "Add Python to PATH" on Windows.)

## Step 2 - Put the project in place

Unzip `finally-reference.zip`. Open a terminal **in the unzipped `finally-reference` folder** (Windows: open the folder, click the address bar, type `powershell`, Enter).

## Step 3 - Install the backend dependencies

```bash
cd backend
uv sync
```
Expected: it creates `backend/.venv` and installs FastAPI, uvicorn, LiteLLM and the rest from `uv.lock`.

## Step 4 - Create your `.env` file

Go back to the project root (`cd ..`) and copy the template:

```bash
# macOS / Linux
cp .env.example .env
# Windows PowerShell
copy .env.example .env
```
For your **first run** open `.env` and set:
```
LLM_MOCK=true
```
(`true` = a fake but working AI, so you need no key yet. Leave `OPENROUTER_API_KEY` and `ALPHAVANTAGE_API_KEY` as they are.)

## Step 5 - Start it

```bash
cd backend
uv run uvicorn app.main:app --port 8000
```
Leave this terminal open. You should see "Uvicorn running on http://127.0.0.1:8000".

## Step 6 - Open the app

Go to **http://localhost:8000**. You should see a dark-green header, a watchlist of 10 stocks whose prices tick, a chart, and a green status dot labelled **Live**. Total value shows **$10,000.00**.

Quick health check: <http://localhost:8000/api/health> should show `"status":"ok"`.

## Step 7 - Try every feature (5 minutes)

1. Click a stock in the watchlist: the big chart switches to it.
2. Trade panel: ticker `AAPL`, quantity `5`, press **Buy**. A message confirms it; the Positions table, heatmap tile, cash and total update.
3. Try to sell `999` AAPL: you get an error saying you only hold 5. Nothing changes.
4. Add a ticker (for example `NFLX` after removing it with the x), or try `ZZZZ` to see it rejected.
5. Hover over the big chart and the portfolio-value chart: a crosshair, a dot on the line, a price badge on the right axis and a tooltip with the time and price follow your mouse (or finger).
6. Chat: type `buy 3 NVDA`. The reply shows a green "Done: BUY 3 NVDA ..." chip and the position appears. Type `buy 100000 TSLA` to see a red "Rejected" chip.
7. Stop the server (Ctrl+C), start it again: your cash and positions are still there (saved in `db/finally.db`).

## Step 8 - Turn on the real AI (optional)

1. Create an account at <https://openrouter.ai/>, create an API key, and check that your account can use the model (you may need credits).
2. In `.env` set `OPENROUTER_API_KEY=your-key` and change `LLM_MOCK=false`.
3. Restart the server (Ctrl+C, run Step 5 again). Chat with: "How is my portfolio doing?", "Buy 2 MSFT".
The model used is `openrouter/openai/gpt-oss-120b` served by Cerebras (see `backend/app/chat/llm.py`). If it cannot be reached, the chat shows a friendly error and no trade is made.

## Step 9 - Login + Supabase (optional)

Follow **SETUP_SUPABASE.md**. In short: create a Supabase project, copy three values into `.env` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`), restart. The app then shows a **Log in / Create account** screen (email + password only) and keeps each user's data separate.

## Step 9b - Real market prices with Alpha Vantage (optional)

Skip this if simulated prices are fine. To use real prices:

1. Get a free key at <https://www.alphavantage.co/support/#api-key> (the page asks for your email).
2. In `.env` set `ALPHAVANTAGE_API_KEY=your-key` (no spaces, no quotes). Set `ALPHAVANTAGE_DAILY_LIMIT` to what your plan allows (the free plan allows very few requests per day; I believe 25, but check their site) and `ALPHAVANTAGE_REQUESTS_PER_MINUTE` likewise (free: about 5).
3. Restart the server. The chip next to "Watchlist" changes from "Simulated" to "Real data".

**How it behaves (important):**
- Alpha Vantage returns **one stock per request**, so the app fetches one stock at a time, always the oldest one, and spreads the requests over the day so your allowance lasts. The first time, it fills all 10 stocks quickly (about 2 minutes, one every 12 seconds); until then some rows show no price and trading those is blocked.
- **Prices change only a few times a day on the free plan**, not every second. The chart starts with two points (previous close and now). This is a limit of the plan, not a bug. A paid plan with a bigger allowance gives fresher prices: raise `ALPHAVANTAGE_DAILY_LIMIT` and `ALPHAVANTAGE_REQUESTS_PER_MINUTE` to match.
- Prices and the request counter are **saved in `db/alphavantage_cache.json`**, so restarting the app does not waste requests. Delete that file to start over.
- If the key is wrong, the plan does not allow the data, or you run out of requests with no saved prices, the app **switches to simulated prices automatically** and says so in the log ("Falling back to SIMULATED prices"). The key is never written to the log.
- Outside US market hours the price is the last close.

**To test your key by hand** (PowerShell; keep the quotes; use `curl.exe`):
```
curl.exe "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY"
```
A block with `"05. price"` means the key works. A message about a limit means you used your allowance. `invalid` means a wrong key. Do not paste your key into chats.

## Step 10 - Run the tests

```bash
cd backend
uv run pytest -q          # expect: 50 passed, 1 skipped (the skipped file needs the pgtest group)
uv run --group pgtest pytest -q   # also runs 6 tests on a real local PostgreSQL: 56 passed
```
Optional frontend checks (needs Node): `cd frontend-tests && node --test logic.test.js` (6 passed). `smoke.dom.js` is a browser-simulation test that needs a running server and `npm install jsdom` (see its first lines).

## Step 11 - Run it in Docker (optional)

```bash
# project root, with .env created
docker build -t finally .
docker run -d --name finally -p 8000:8000 --env-file .env -v "$(pwd)/db:/app/db" finally     # Windows PowerShell: -v "${PWD}/db:/app/db"
```
Or use `./scripts/start_mac.sh --build` / `.\scripts\start_windows.ps1 -Build`. Open http://localhost:8000. Stop with `docker rm -f finally`.

## Step 12 - Change the look

All colors are CSS variables at the top of `static/css/styles.css`. Reload the page after saving; no rebuild.

| Variable | Value | Used for |
|---|---|---|
| `--green` | `#1F3D2B` | header, text, Buy button, chart line |
| `--cream` | `#F6F3ED` | page background, header text |
| `--gold` | `#BFA76A` | accents, header underline, selection, chart fill, main buttons |
| `--taupe` | `#A58970` | borders, labels, Sell button, neutral heatmap tiles |
| `--up` / `--down` | `#2F7A4D` / `#B0443A` | rising and falling prices. Your four colors have no clear "red", so these two are my additions; change them freely |

## Folder map

```
finally-reference/
|-- static/                 FRONTEND  index.html, css/styles.css, js/{app,api,auth,charts,logic}.js
|-- supabase/schema.sql     optional: tables for the Supabase SQL Editor
|-- backend/                BACKEND   app/ (api, market, portfolio, watchlist, chat, db), tests/, pyproject.toml, uv.lock
|-- frontend-tests/         Node tests for the frontend logic + a DOM smoke test
|-- db/                     finally.db appears here when you first run
|-- scripts/ Dockerfile docker-compose.yml .env.example SETUP_A_to_Z.md
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `uv` not found | reopen the terminal after installing; on Windows make sure the install finished |
| Log says "Falling back to SIMULATED prices" | the Alpha Vantage key is wrong, out of requests, or not allowed: see Step 9b. Empty `ALPHAVANTAGE_API_KEY` to silence it |
| Real prices barely change | normal on the free plan (few requests per day). See Step 9b |
| `--port` error: "requires an argument" | the command needs a number: `uv run uvicorn app.main:app --port 8000`. Do not run `npm run dev`; this project has no Node server |
| Port 8000 already in use | use `--port 8001` and open `http://localhost:8001` |
| Page loads but says "Reconnecting" | the server stopped; restart it. The page reconnects by itself |
| Page is blank / 404 on `/` | start the server from the `backend` folder; `static/` must sit next to `backend/` (or set `FINALLY_STATIC_DIR`) |
| Chat says it "couldn't reach the AI model" | key missing or invalid, no credits, or no internet. Set `LLM_MOCK=true` to confirm everything else works |
| Prices barely move | normal: the simulator uses realistic tiny moves per tick (see guide, Step 3). Percent shown is change over roughly the last 90 seconds |
| Data reset | delete `db/finally.db` to start over with $10,000 |
| Edited `.env` but nothing changed | restart the server; `.env` is read at startup |
| Login screen appears but you never configured Supabase | `SUPABASE_URL` is set in `.env`; empty it for demo mode |
