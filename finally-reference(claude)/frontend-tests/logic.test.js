const test = require("node:test"), assert = require("node:assert");
const L = require("../static/js/logic.js");

test("money / pct / qty formatting", () => {
  assert.equal(L.money(1234.5), "$1,234.50"); assert.equal(L.money(-3), "-$3.00"); assert.equal(L.money(null), "--");
  assert.equal(L.pct(1.234), "+1.23%"); assert.equal(L.pct(-0.5), "-0.50%"); assert.equal(L.signedMoney(5), "+$5.00");
  assert.equal(L.qty(0.12345678), "0.1235");
});
test("treemap tiles cover the unit square exactly, sized by value", () => {
  const r = L.treemap([{ key: "A", value: 50 }, { key: "B", value: 30 }, { key: "C", value: 20 }, { key: "Z", value: 0 }]);
  assert.equal(r.length, 3);
  const area = r.reduce((s, t) => s + t.w * t.h, 0); assert.ok(Math.abs(area - 1) < 1e-9);
  const a = r.find((t) => t.key === "A"); assert.ok(Math.abs(a.w * a.h - 0.5) < 1e-9);
  r.forEach((t) => { assert.ok(t.x >= 0 && t.y >= 0 && t.x + t.w <= 1 + 1e-9 && t.y + t.h <= 1 + 1e-9); });
});
test("treemap single item and empty", () => {
  assert.deepEqual(L.treemap([]), []);
  const one = L.treemap([{ key: "A", value: 9 }]); assert.deepEqual([one[0].x, one[0].y, one[0].w, one[0].h], [0, 0, 1, 1]);
});
test("pnlColor: taupe at 0, greener when up, redder when down, clamped", () => {
  assert.equal(L.pnlColor(0), "rgb(165,137,112)");
  assert.equal(L.pnlColor(5), "rgb(47,122,77)"); assert.equal(L.pnlColor(50), "rgb(47,122,77)");
  assert.equal(L.pnlColor(-5), "rgb(176,68,58)");
});
test("linePath handles flat and normal series", () => {
  const flat = L.linePath([5, 5, 5], 100, 50, 2); assert.ok(flat.line.startsWith("M")); assert.ok(flat.hi > flat.lo);
  const p = L.linePath([1, 2, 3], 100, 50, 2); assert.equal(p.pts.length, 3); assert.ok(p.pts[2][1] < p.pts[0][1]);   // higher value = smaller y
  assert.equal(L.linePath([], 10, 10, 1).line, "");
});
test("errorMessage reads the backend error shapes", () => {
  assert.equal(L.errorMessage({ detail: { code: "x", message: "Need more cash" } }, 400), "Need more cash");
  assert.equal(L.errorMessage({ detail: "plain" }, 400), "plain");
  assert.equal(L.errorMessage({ detail: [{ msg: "field required" }] }, 422), "field required");
  assert.equal(L.errorMessage(null, 500), "Request failed (HTTP 500)");
});
