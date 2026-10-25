/* FinAlly UI controller. Talks only to /api/* on the same origin. */
(function () {
  "use strict";
  const L = window.FALogic, api = window.FAApi, C = window.FACharts;
  const $ = (id) => document.getElementById(id);
  const MAX_POINTS = 180;
  const state = { prices: {}, series: {}, times: {}, pnlTimes: [], watchlist: [], portfolio: null, pnl: [], selected: "AAPL", rows: {}, chatBusy: false, redraw: false };

  /* ---------- helpers ---------- */
  let toastTimer;
  function toast(msg, isErr) {
    const t = $("toast"); t.textContent = msg; t.className = "toast" + (isErr ? " err" : ""); t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, isErr ? 5500 : 3200);
  }
  const clean = (v) => String(v || "").trim().toUpperCase().replace(/[^A-Z]/g, "");
  const tickOf = (t) => state.prices[t];
  const fmtTime = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }); };
  const fmtDateTime = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString([], { month: "short", day: "numeric" }) + "  " + fmtTime(iso); };

  /* ---------- watchlist ---------- */
  function buildRow(t) {
    const li = document.createElement("li"); li.dataset.t = t;
    li.innerHTML = '<span class="tk"></span><span class="px num"></span>' +
      '<svg viewBox="0 0 64 26" aria-hidden="true"></svg><span class="pc"></span><button class="rm" title="Remove" aria-label="Remove">&times;</button>';
    li.querySelector(".tk").textContent = t;
    li.addEventListener("click", (e) => { if (e.target.closest(".rm")) return; select(t); });
    li.querySelector(".rm").addEventListener("click", async () => {
      try { await api.del("/api/watchlist/" + t); await loadWatchlist(false); } catch (e) { toast(e.message, true); }
    });
    return { li, px: li.querySelector(".px"), pc: li.querySelector(".pc"), svg: li.querySelector("svg") };
  }
  function renderWatchlist() {
    const ul = $("wl"); ul.textContent = ""; state.rows = {};
    state.watchlist.forEach((w) => { const r = buildRow(w.ticker); state.rows[w.ticker] = r; ul.appendChild(r.li); updateRow(w.ticker); });
    markSelected();
  }
  function updateRow(t, flash) {
    const r = state.rows[t]; const k = tickOf(t); if (!r || !k) return;
    const s = state.series[t] || [], base = s.length ? s[0] : k.price;
    const chg = base ? (k.price / base - 1) * 100 : 0, cls = L.dir(chg);
    r.px.textContent = k.price.toFixed(2);
    r.pc.textContent = L.pct(chg);                       // change over the visible window (about 90 s of history)
    r.pc.className = "pc num " + cls;
    C.sparkline(r.svg, s, cls);
    if (flash && k.direction !== "flat") {               // flash follows the latest tick direction
      r.li.classList.remove("flash-up", "flash-down"); void r.li.offsetWidth; r.li.classList.add("flash-" + k.direction);
    }
  }
  function markSelected() {
    Object.keys(state.rows).forEach((t) => state.rows[t].li.classList.toggle("sel", t === state.selected));
  }
  async function loadWatchlist(seed) {
    const list = await api.get("/api/watchlist");
    state.watchlist = list;
    list.forEach((w) => { if (w.price != null) state.prices[w.ticker] = state.prices[w.ticker] || { ticker: w.ticker, price: w.price, prev_price: w.prev_price, change_percent: w.change_percent || 0, direction: w.direction }; });
    if (!list.find((w) => w.ticker === state.selected) && list.length) state.selected = list[0].ticker;
    const missing = list.map((w) => w.ticker).filter((t) => !state.series[t] || seed);
    await Promise.all(missing.map(async (t) => {
      try {
        const hist = await api.get("/api/prices/" + t + "/history");
        state.series[t] = hist.map((p) => p.price); state.times[t] = hist.map((p) => p.timestamp);
      } catch (e) { state.series[t] = []; state.times[t] = []; }
    }));
    renderWatchlist(); drawMain();
  }

  /* ---------- selected ticker chart ---------- */
  function select(t) {
    state.selected = t; markSelected(); $("tr-ticker").value = t; drawMain(); updateEstimate();
  }
  function drawMain() {
    const t = state.selected, k = tickOf(t), vals = state.series[t] || [];
    $("ch-ticker").textContent = t; $("ch-name").textContent = L.NAMES[t] || "";
    if (k) {
      $("ch-price").textContent = "$" + k.price.toFixed(2);
      const first = vals.length ? vals[0] : k.price, chg = first ? (k.price / first - 1) * 100 : 0;
      const p = $("ch-pct"); p.textContent = L.pct(chg) + " in view"; p.className = "pct " + L.dir(chg);
    }
    const times = state.times[t] || [];
    C.lineChart($("main-chart"), vals, {
      format: (n) => n.toFixed(2), emptyText: "Waiting for prices...",
      tooltip: (i, v) => {
        const d = vals[0] ? (v / vals[0] - 1) * 100 : 0;
        return { title: t + "  " + fmtTime(times[i]), value: "$" + v.toFixed(2), sub: L.pct(d) + " vs start of chart", subClass: L.dir(d) };
      },
    });
  }
  function scheduleMain() {
    if (state.redraw) return; state.redraw = true;
    requestAnimationFrame(() => { state.redraw = false; drawMain(); });
  }

  /* ---------- portfolio ---------- */
  function setStat(id, text, cls) { const e = $(id); e.textContent = text; e.className = "stat-value" + (cls ? " " + cls : ""); }
  function renderPortfolio() {
    const p = state.portfolio; if (!p) return;
    setStat("st-total", L.money(p.total_value)); setStat("st-cash", L.money(p.cash_balance));
    setStat("st-pnl", L.signedMoney(p.total_pnl), L.dir(p.total_pnl));
    const body = $("pos-body"); body.textContent = "";
    $("pos-empty").hidden = p.positions.length > 0;
    p.positions.forEach((x) => {
      const tr = document.createElement("tr");
      [x.ticker, L.qty(x.quantity), x.avg_cost.toFixed(2), x.current_price.toFixed(2), L.signedMoney(x.unrealized_pnl), L.pct(x.pnl_percent)].forEach((v, i) => {
        const td = document.createElement("td"); td.textContent = v; if (i >= 4) td.className = L.dir(x.unrealized_pnl); tr.appendChild(td);
      });
      tr.addEventListener("click", () => select(x.ticker)); body.appendChild(tr);
    });
    C.heatmap($("heatmap"), p.positions, select);
  }
  async function loadPortfolio() { state.portfolio = await api.get("/api/portfolio"); renderPortfolio(); }
  async function loadPnl() {
    const h = await api.get("/api/portfolio/history");
    state.pnl = h.map((x) => x.total_value); state.pnlTimes = h.map((x) => x.recorded_at);
    C.lineChart($("pnl-chart"), state.pnl, {
      baseline: 10000, format: (n) => "$" + Math.round(n).toLocaleString("en-US"), emptyText: "Trade to start your value history.",
      tooltip: (i, v) => ({ title: fmtDateTime(state.pnlTimes[i]), value: L.money(v), sub: L.signedMoney(v - 10000) + " vs $10,000 start", subClass: L.dir(v - 10000) }),
    });
  }

  /* ---------- trade bar ---------- */
  function updateEstimate() {
    const t = clean($("tr-ticker").value), q = parseFloat($("tr-qty").value), k = tickOf(t);
    $("tr-est").textContent = k && q > 0 ? "Estimated: " + L.money(k.price * q) + " at " + k.price.toFixed(2) : (k ? "Price: " + k.price.toFixed(2) : "Estimated: --");
  }
  async function submitTrade(side) {
    const ticker = clean($("tr-ticker").value), quantity = parseFloat($("tr-qty").value);
    if (!ticker) return toast("Enter a ticker (for example AAPL).", true);
    if (!(quantity > 0)) return toast("Quantity must be greater than zero.", true);
    const btns = document.querySelectorAll("#trade-form button"); btns.forEach((b) => (b.disabled = true));
    try {
      const r = await api.post("/api/portfolio/trade", { ticker, quantity, side });
      toast((side === "buy" ? "Bought " : "Sold ") + L.qty(r.quantity) + " " + r.ticker + " @ " + r.price.toFixed(2));
      $("tr-qty").value = ""; updateEstimate();
      await Promise.all([loadPortfolio(), loadPnl()]);
    } catch (e) { toast(e.message, true); }
    finally { btns.forEach((b) => (b.disabled = false)); }
  }

  /* ---------- chat ---------- */
  function addMsg(role, text, actions) {
    const log = $("chat-log"); const d = document.createElement("div"); d.className = "msg " + role; d.textContent = text;
    if (actions && actions.length) {
      const box = document.createElement("div"); box.className = "actions";
      actions.forEach((a) => { const c = document.createElement("div"); c.className = "action" + (a.success ? "" : " fail"); c.textContent = (a.success ? "Done: " : "Rejected: ") + a.detail; box.appendChild(c); });
      d.appendChild(box);
    }
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  async function loadChat() {
    const log = $("chat-log"); log.textContent = "";
    let msgs = []; try { msgs = await api.get("/api/chat"); } catch (e) { /* first run */ }
    if (!msgs.length) addMsg("hint", "Hi, I'm FinAlly. Ask me to review your portfolio, or try: \"buy 5 NVDA\" or \"add NFLX to my watchlist\".");
    msgs.forEach((m) => addMsg(m.role, m.content, m.actions));
  }
  async function sendChat(text) {
    if (state.chatBusy || !text.trim()) return;
    state.chatBusy = true; $("chat-send").disabled = true;
    document.querySelectorAll(".msg.hint").forEach((n) => n.remove());
    addMsg("user", text);
    const wait = addMsg("assistant", ""); wait.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    try {
      const r = await api.post("/api/chat", { content: text });
      wait.remove(); addMsg("assistant", r.content, r.actions);
      if (r.actions && r.actions.length) { await Promise.all([loadPortfolio(), loadPnl(), loadWatchlist(false)]); }
    } catch (e) { wait.remove(); addMsg("assistant", "Sorry, something went wrong: " + e.message); }
    finally { state.chatBusy = false; $("chat-send").disabled = false; $("chat-input").focus(); }
  }

  /* ---------- live prices (SSE) ---------- */
  function setStatus(ok) { $("st-dot").className = "dot " + (ok ? "ok" : "bad"); $("st-text").textContent = ok ? "Live" : "Reconnecting"; }
  function connectStream() {
    const es = new EventSource("/api/stream/prices");
    es.onopen = () => setStatus(true);
    es.onerror = () => setStatus(false);       // the browser retries automatically
    es.onmessage = (ev) => {
      let k; try { k = JSON.parse(ev.data); } catch (e) { return; }
      const prev = state.prices[k.ticker];
      state.prices[k.ticker] = k;
      const s = state.series[k.ticker] || (state.series[k.ticker] = []);
      const tm = state.times[k.ticker] || (state.times[k.ticker] = []);
      s.push(k.price); tm.push(k.timestamp); if (s.length > MAX_POINTS) { s.shift(); tm.shift(); }
      updateRow(k.ticker, !!prev && prev.price !== k.price);
      if (k.ticker === state.selected) scheduleMain();
    };
  }

  /* ---------- wiring ---------- */
  function wire() {
    $("wl-form").addEventListener("submit", async (e) => {
      e.preventDefault(); const t = clean($("wl-input").value); if (!t) return;
      try { await api.post("/api/watchlist", { ticker: t }); $("wl-input").value = ""; await loadWatchlist(false); toast(t + " added to watchlist"); }
      catch (err) { toast(err.message, true); }
    });
    $("trade-form").addEventListener("submit", (e) => { e.preventDefault(); submitTrade((e.submitter && e.submitter.dataset.side) || "buy"); });
    $("tr-ticker").addEventListener("input", updateEstimate); $("tr-qty").addEventListener("input", updateEstimate);
    $("chat-form").addEventListener("submit", (e) => { e.preventDefault(); const i = $("chat-input"); const v = i.value; i.value = ""; sendChat(v); });
    window.addEventListener("resize", () => { scheduleMain(); loadPnl().catch(() => {}); });
  }

  async function startApp(user) {
    if (user) {
      $("st-user").textContent = user.email || ""; $("user-box").hidden = false;
      $("btn-logout").addEventListener("click", () => window.FAAuth.logout());
    }
    wire(); $("tr-ticker").value = state.selected;
    setStatus(false); $("st-text").textContent = "Connecting";
    try {
      await Promise.all([loadWatchlist(true), loadPortfolio(), loadPnl(), loadChat()]);
      api.get("/api/health").then((h) => { $("provider").textContent = h.market_data === "AlphaVantageProvider" ? "Real data" : "Simulated"; }).catch(() => {});
    } catch (e) { toast(e.message, true); }
    connectStream();
    setInterval(() => loadPortfolio().catch(() => {}), 2000);
    setInterval(() => loadPnl().catch(() => {}), 15000);
    updateEstimate();
  }
  function init() { window.FAAuth.boot().then(startApp); }      // shows the login screen first when the server requires it
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
