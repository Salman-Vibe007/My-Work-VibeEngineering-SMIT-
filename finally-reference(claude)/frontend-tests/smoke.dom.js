/* Headless DOM smoke test (jsdom) against a RUNNING backend.
   MODE=demo : backend without login.  MODE=auth : backend with SUPABASE_URL pointing at the fake Supabase.
   Usage: BASE=http://127.0.0.1:8766 MODE=demo node smoke.dom.js   (set JSDOM_PATH if jsdom is not local) */
const { JSDOM } = require(process.env.JSDOM_PATH || "jsdom");
const BASE = process.env.BASE || "http://127.0.0.1:8766", MODE = process.env.MODE || "demo";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) failures++; };

class ES {                       // minimal EventSource using node fetch streaming
  constructor(url) { this.url = new URL(url, BASE).href; this.closed = false; this.run(); }
  async run() {
    try {
      const res = await fetch(this.url); this.onopen && this.onopen({});
      const rd = res.body.getReader(), dec = new TextDecoder(); let buf = "";
      while (!this.closed) {
        const { value, done } = await rd.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); let i;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (line && this.onmessage) this.onmessage({ data: line.slice(6) });
        }
      }
    } catch (e) { this.onerror && this.onerror(e); }
  }
  close() { this.closed = true; }
}
async function open(session) {
  const errors = [];
  const dom = await JSDOM.fromURL(BASE + "/", {
    runScripts: "dangerously", resources: "usable", pretendToBeVisual: true,
    beforeParse(w) {
      w.fetch = (u, o) => fetch(new URL(u, BASE), o); w.EventSource = ES;
      if (session) w.localStorage.setItem("finally.session", JSON.stringify(session));
      w.addEventListener("error", (e) => errors.push(e.message));
    },
  });
  dom.errors = errors; dom.d = dom.window.document; dom.$ = (id) => dom.window.document.getElementById(id);
  return dom;
}
const submit = (dom, formId, btnSel) => dom.$(formId).requestSubmit(btnSel ? dom.d.querySelector(btnSel) : undefined);
const type = (dom, id, v) => { dom.$(id).value = v; };
const move = (dom, host, x, type = "pointermove") => host.querySelector("svg").dispatchEvent(new dom.window.MouseEvent(type, { clientX: x, bubbles: true }));

async function checkApp(dom, label) {
  const { d, $ } = dom;
  ok(d.querySelectorAll("#wl li").length === 10, label + ": watchlist renders 10 rows");
  ok($("st-total").textContent === "$10,000.00", label + ": header total = $10,000.00 (" + $("st-total").textContent + ")");
  ok($("st-dot").className.includes("ok"), label + ": status dot is live");
  ok($("ch-ticker").textContent === "AAPL" && !!$("main-chart").querySelector("svg"), label + ": main chart drawn");
}
async function hoverChecks(dom) {
  const { d, $ } = dom, host = $("main-chart");
  move(dom, host, 300);
  const tip = host.querySelector(".tip"), g = host.querySelector("g.hover");
  ok(tip && !tip.hidden && /^\$\d+\.\d\d$/.test(tip.querySelector(".v").textContent), "hover: tooltip shows price (" + (tip && tip.querySelector(".v").textContent) + ")");
  ok(/AAPL\s+\d/.test(tip.querySelector(".t").textContent), "hover: tooltip title has ticker + time (" + tip.querySelector(".t").textContent + ")");
  ok(/vs start of chart/.test(tip.querySelector(".s").textContent), "hover: tooltip shows change vs start");
  ok(g.getAttribute("visibility") === "visible", "hover: crosshair + dot visible");
  ok(/^\d+\.\d\d$/.test(g.querySelector("text").textContent), "hover: axis value badge shows price");
  const x1 = g.querySelector("line").getAttribute("x1"); move(dom, host, 120);
  ok(g.querySelector("line").getAttribute("x1") !== x1, "hover: crosshair follows the pointer");
  await sleep(1600);                                           // live ticks redraw the chart
  const tip2 = host.querySelector(".tip");
  ok(tip2 && !tip2.hidden, "hover: tooltip survives live redraws while pointer stays");
  host.querySelector("svg").dispatchEvent(new dom.window.MouseEvent("pointerleave", { bubbles: true }));
  ok(host.querySelector(".tip").hidden && host.querySelector("g.hover").getAttribute("visibility") === "hidden", "hover: hides on pointer leave");
}
async function trading(dom, label) {
  const { d, $ } = dom;
  type(dom, "tr-ticker", "AAPL"); type(dom, "tr-qty", "5"); submit(dom, "trade-form", '#trade-form [data-side="buy"]'); await sleep(2500);
  ok($("pos-body").querySelectorAll("tr").length === 1, label + ": position row appears after buy");
  ok(!$("toast").hidden && /Bought/.test($("toast").textContent), label + ": toast confirms the buy");
  type(dom, "tr-qty", "1"); submit(dom, "trade-form", '#trade-form [data-side="sell"]'); await sleep(2200);
  const h = $("pnl-chart"); move(dom, h, 200);
  const tip = h.querySelector(".tip");
  ok(tip && !tip.hidden && /^\$[\d,]+\.\d\d$/.test(tip.querySelector(".v").textContent) && /vs \$10,000 start/.test(tip.querySelector(".s").textContent), label + ": P&L chart tooltip (" + (tip && tip.querySelector(".v").textContent + " | " + tip.querySelector(".s").textContent) + ")");
  type(dom, "tr-qty", "999"); submit(dom, "trade-form", '#trade-form [data-side="sell"]'); await sleep(1200);
  ok(/Cannot sell|holding/.test($("toast").textContent) && $("toast").className.includes("err"), label + ": bad sell shows backend error");
  type(dom, "chat-input", "buy 3 NVDA"); submit(dom, "chat-form"); await sleep(3000);
  ok([...d.querySelectorAll(".msg")].some((m) => m.className.startsWith("msg assistant") && m.textContent.includes("Done: BUY 3 NVDA")), label + ": chat executes a trade");
}

(async () => {
  if (MODE === "demo") {
    const dom = await open();
    await sleep(4000);
    ok(dom.$("auth").hidden, "demo: no login screen"); ok(dom.$("user-box").hidden, "demo: no user chip");
    await checkApp(dom, "demo"); ok(dom.$("provider").textContent === "Simulated", "demo: provider chip says Simulated");
    await hoverChecks(dom); await trading(dom, "demo");
    ok(dom.errors.length === 0, "demo: no JS errors " + JSON.stringify(dom.errors));
  } else {
    // 1. logged out: login screen shown, app not started
    let dom = await open(); await sleep(2000);
    ok(!dom.$("auth").hidden, "auth: login screen is shown"); ok(dom.d.querySelectorAll("#wl li").length === 0, "auth: app data not loaded before login");
    ok(!/google|microsoft|oauth/i.test(dom.$("auth").textContent), "auth: no Google/Microsoft sign-in options");
    // 2. validation
    dom.$("tab-signup").click(); ok(!dom.$("au-confirm-wrap").hidden && dom.$("au-submit").textContent === "Create account", "auth: create-account tab");
    type(dom, "au-email", "nope"); type(dom, "au-pass", "password123"); type(dom, "au-pass2", "password123"); submit(dom, "auth-form");
    await sleep(200); ok(/valid email/.test(dom.$("au-error").textContent), "auth: bad email rejected");
    type(dom, "au-email", "ali@example.com"); type(dom, "au-pass", "short"); type(dom, "au-pass2", "short"); submit(dom, "auth-form");
    await sleep(200); ok(/at least 8/.test(dom.$("au-error").textContent), "auth: short password rejected");
    type(dom, "au-pass", "password123"); type(dom, "au-pass2", "different123"); submit(dom, "auth-form");
    await sleep(200); ok(/do not match/.test(dom.$("au-error").textContent), "auth: password mismatch rejected");
    // 3. create account -> app starts
    type(dom, "au-pass2", "password123"); submit(dom, "auth-form"); await sleep(4500);
    ok(dom.$("auth").hidden, "auth: screen closes after signup"); ok(!dom.$("user-box").hidden && dom.$("st-user").textContent === "ali@example.com", "auth: header shows the user's email");
    await checkApp(dom, "auth"); await hoverChecks(dom); await trading(dom, "auth");
    const saved = JSON.parse(dom.window.localStorage.getItem("finally.session") || "null");
    ok(saved && saved.access_token && saved.refresh_token, "auth: session saved for reloads");
    // 4. logout
    dom.window.FAAuth.reload = () => { dom.window.__reloaded = true; };
    dom.$("btn-logout").click(); await sleep(300);
    ok(dom.window.localStorage.getItem("finally.session") === null && dom.window.__reloaded === true, "auth: logout clears the session and reloads");
    ok(dom.errors.length === 0, "auth: no JS errors " + JSON.stringify(dom.errors));
    // 5. login with wrong then right password
    let d2 = await open(); await sleep(1500);
    type(d2, "au-email", "ali@example.com"); type(d2, "au-pass", "wrongpassword"); submit(d2, "auth-form"); await sleep(800);
    ok(d2.$("au-error").textContent === "Invalid email or password." && !d2.$("auth").hidden, "auth: wrong password shows error");
    type(d2, "au-pass", "password123"); submit(d2, "auth-form"); await sleep(4000);
    ok(d2.$("auth").hidden && d2.$("pos-body").querySelectorAll("tr").length >= 1, "auth: login restores this user's own positions");
    // 6. returning visitor with a saved session skips the login screen
    let d3 = await open(saved); await sleep(3500);
    ok(d3.$("auth").hidden && d3.$("st-user").textContent === "ali@example.com", "auth: saved session skips the login screen");
    // 7. expired access token + valid refresh token -> silent refresh
    let d4 = await open({ access_token: "at_expired", refresh_token: saved.refresh_token, user: saved.user }); await sleep(3500);
    ok(d4.$("auth").hidden && d4.d.querySelectorAll("#wl li").length === 10, "auth: expired token refreshed silently");
    // 8. second account sees an empty portfolio
    let d5 = await open(); await sleep(1500);
    d5.$("tab-signup").click(); type(d5, "au-email", "sara@example.com"); type(d5, "au-pass", "password456"); type(d5, "au-pass2", "password456"); submit(d5, "auth-form"); await sleep(4500);
    ok(d5.$("st-user").textContent === "sara@example.com" && d5.$("st-total").textContent === "$10,000.00" && d5.$("pos-body").querySelectorAll("tr").length === 0, "auth: a second user starts fresh and cannot see the first user's trades");
    // 9. duplicate email
    let d6 = await open(); await sleep(1500);
    d6.$("tab-signup").click(); type(d6, "au-email", "sara@example.com"); type(d6, "au-pass", "password456"); type(d6, "au-pass2", "password456"); submit(d6, "auth-form"); await sleep(800);
    ok(/already/i.test(d6.$("au-error").textContent), "auth: duplicate account rejected (" + d6.$("au-error").textContent + ")");
  }
  console.log(failures ? "\n" + failures + " FAILED" : "\nALL PASSED");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("SMOKE CRASH", e); process.exit(2); });
