/* Pure helpers (no DOM). Works in the browser (window.FALogic) and in Node (tests). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FALogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const NAMES = { AAPL: "Apple", GOOGL: "Alphabet", MSFT: "Microsoft", AMZN: "Amazon", TSLA: "Tesla",
                  NVDA: "NVIDIA", META: "Meta Platforms", JPM: "JPMorgan Chase", V: "Visa", NFLX: "Netflix" };
  const COLORS = { neutral: [165, 137, 112], up: [47, 122, 77], down: [176, 68, 58] };   // taupe, green, red

  const money = (n) => n == null || isNaN(n) ? "--" :
    (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const signedMoney = (n) => n == null || isNaN(n) ? "--" : (n > 0 ? "+" : "") + money(n);
  const pct = (n) => n == null || isNaN(n) ? "--" : (n > 0 ? "+" : "") + n.toFixed(2) + "%";
  const qty = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 4 });
  const dir = (n) => (n > 0 ? "up" : n < 0 ? "down" : "");

  function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
  /* P&L percent -> tile color: taupe at 0, full green/red at +/-5 percent */
  function pnlColor(p) {
    const t = Math.min(Math.abs(p || 0) / 5, 1);
    const c = mix(COLORS.neutral, p >= 0 ? COLORS.up : COLORS.down, t);
    return "rgb(" + c.join(",") + ")";
  }

  /* Binary-split treemap. items: [{key, value, ...}] -> [{...item, x, y, w, h}] as fractions of 0..1 */
  function treemap(items) {
    const list = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
    const out = [];
    (function split(arr, x, y, w, h) {
      if (!arr.length) return;
      if (arr.length === 1) { out.push(Object.assign({}, arr[0], { x, y, w, h })); return; }
      const total = arr.reduce((s, i) => s + i.value, 0);
      let acc = 0, k = 1;
      for (let i = 0; i < arr.length - 1; i++) { acc += arr[i].value; k = i + 1; if (acc >= total / 2) break; }
      const a = arr.slice(0, k), b = arr.slice(k);
      const fa = a.reduce((s, i) => s + i.value, 0) / total;
      if (w >= h) { split(a, x, y, w * fa, h); split(b, x + w * fa, y, w * (1 - fa), h); }
      else { split(a, x, y, w, h * fa); split(b, x, y + h * fa, w, h * (1 - fa)); }
    })(list, 0, 0, 1, 1);
    return out;
  }

  /* Build SVG path strings for a series of numbers inside a width x height box. */
  function linePath(values, w, h, pad, lo, hi) {
    if (!values.length) return { line: "", area: "", lo: 0, hi: 0, last: null };
    lo = lo == null ? Math.min.apply(null, values) : lo;
    hi = hi == null ? Math.max.apply(null, values) : hi;
    if (hi === lo) { hi += 1; lo -= 1; }
    const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
    const pts = values.map((v, i) => [pad + i * step, pad + (1 - (v - lo) / (hi - lo)) * (h - pad * 2)]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = line + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (h - pad) + " L" + pts[0][0].toFixed(1) + " " + (h - pad) + " Z";
    return { line, area, lo, hi, last: pts[pts.length - 1], pts };
  }

  /* Turn a failed API response body into a readable sentence. */
  function errorMessage(body, status) {
    if (body && body.detail) {
      if (typeof body.detail === "string") return body.detail;
      if (body.detail.message) return body.detail.message;
      if (Array.isArray(body.detail) && body.detail[0] && body.detail[0].msg) return body.detail[0].msg;
    }
    return "Request failed" + (status ? " (HTTP " + status + ")" : "");
  }

  return { NAMES, money, signedMoney, pct, qty, dir, pnlColor, treemap, linePath, errorMessage };
});
