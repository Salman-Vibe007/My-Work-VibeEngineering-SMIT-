/* SVG chart renderers. Everything is built from numbers we control; no HTML from the server is injected. */
(function (root) {
  const NS = "http://www.w3.org/2000/svg";
  const L = root.FALogic;
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const size = (host, fw, fh) => ({ w: host.clientWidth || fw, h: host.clientHeight || fh });

  /* Tiny sparkline inside an existing <svg viewBox="0 0 64 26"> */
  function sparkline(svg, values, colorClass) {
    const p = L.linePath(values.slice(-60), 64, 26, 2);
    let path = svg.querySelector("path");
    if (!path) path = el("path", { fill: "none", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }, svg);
    path.setAttribute("d", p.line);
    path.setAttribute("stroke", colorClass === "down" ? "#B0443A" : colorClass === "up" ? "#2F7A4D" : "#A58970");
  }

  /* Full line chart with area fill, min/max labels, optional dashed baseline and an interactive hover:
     crosshair + hover dot + value badge on the right axis + tooltip.
     opts: { format(n), baseline, emptyText, labels[] (one per value), tooltip(i, value) -> {title, value, sub, subClass} } */
  function lineChart(host, values, opts) {
    opts = opts || {};
    host.textContent = "";
    if (values.length < 2) {
      const d = document.createElement("div"); d.className = "empty"; d.textContent = opts.emptyText || "Waiting for data...";
      host.appendChild(d); return;
    }
    const fmt = opts.format || ((n) => n.toFixed(2));
    const { w, h } = size(host, 600, 260);
    const pad = 14, labelW = 58;
    const all = opts.baseline != null ? values.concat([opts.baseline]) : values;
    let lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    const span = (hi - lo) || 1; lo -= span * 0.08; hi += span * 0.08;
    const p = L.linePath(values, w - labelW, h, pad, lo, hi);
    const svg = el("svg", { viewBox: "0 0 " + w + " " + h, preserveAspectRatio: "none", role: "presentation" });
    const gid = "g" + Math.random().toString(36).slice(2, 8);
    const defs = el("defs", {}, svg);
    const grad = el("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el("stop", { offset: "0%", "stop-color": "#BFA76A", "stop-opacity": ".45" }, grad);
    el("stop", { offset: "100%", "stop-color": "#BFA76A", "stop-opacity": "0" }, grad);
    const yOf = (v) => pad + (1 - (v - lo) / (hi - lo)) * (h - pad * 2);
    [lo + (hi - lo) * 0.1, (lo + hi) / 2, hi - (hi - lo) * 0.1].forEach((v) => {
      el("line", { x1: 0, x2: w - labelW, y1: yOf(v), y2: yOf(v), stroke: "#A58970", "stroke-opacity": ".22" }, svg);
      const t = el("text", { x: w - labelW + 6, y: yOf(v) + 4, fill: "#6f5f50", "font-size": "11" }, svg);
      t.textContent = fmt(v);
    });
    if (opts.baseline != null)
      el("line", { x1: 0, x2: w - labelW, y1: yOf(opts.baseline), y2: yOf(opts.baseline), stroke: "#1F3D2B", "stroke-dasharray": "5 5", "stroke-opacity": ".55" }, svg);
    el("path", { d: p.area, fill: "url(#" + gid + ")" }, svg);
    el("path", { d: p.line, fill: "none", stroke: "#1F3D2B", "stroke-width": "2", "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
    const lastDot = p.last && el("circle", { cx: p.last[0], cy: p.last[1], r: 4.5, fill: "#BFA76A", stroke: "#1F3D2B", "stroke-width": "2" }, svg);

    /* ---- hover layer ---- */
    const g = el("g", { class: "hover", visibility: "hidden", "pointer-events": "none" }, svg);
    const vline = el("line", { y1: pad, y2: h - pad, stroke: "#1F3D2B", "stroke-opacity": ".5", "stroke-dasharray": "4 4" }, g);
    const hline = el("line", { x1: 0, x2: w - labelW, stroke: "#1F3D2B", "stroke-opacity": ".35", "stroke-dasharray": "4 4" }, g);
    const dot = el("circle", { r: 6, fill: "#F6F3ED", stroke: "#1F3D2B", "stroke-width": "2.5" }, g);
    const badge = el("rect", { x: w - labelW + 2, width: labelW - 4, height: 18, rx: 5, fill: "#1F3D2B" }, g);
    const badgeTxt = el("text", { x: w - labelW + 7, "font-size": "11", fill: "#F6F3ED", "font-weight": "600" }, g);
    const hit = el("rect", { x: 0, y: 0, width: w, height: h, fill: "transparent" }, svg);   // captures pointer events
    host.appendChild(svg);

    const tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true; host.appendChild(tip);
    const tipT = document.createElement("div"); tipT.className = "t";
    const tipV = document.createElement("div"); tipV.className = "v";
    const tipS = document.createElement("div"); tipS.className = "s";
    tip.appendChild(tipT); tip.appendChild(tipV); tip.appendChild(tipS);

    const step = values.length > 1 ? (w - labelW - pad * 2) / (values.length - 1) : 0;
    function show(frac) {                                   // frac = pointer x as a 0..1 fraction of the chart width
      const x = frac * w;
      const i = Math.max(0, Math.min(values.length - 1, Math.round((x - pad) / (step || 1))));
      const pt = p.pts[i], v = values[i];
      g.setAttribute("visibility", "visible"); if (lastDot) lastDot.setAttribute("opacity", ".35");
      vline.setAttribute("x1", pt[0]); vline.setAttribute("x2", pt[0]);
      hline.setAttribute("y1", pt[1]); hline.setAttribute("y2", pt[1]);
      dot.setAttribute("cx", pt[0]); dot.setAttribute("cy", pt[1]);
      const by = Math.max(0, Math.min(h - 18, pt[1] - 9)); badge.setAttribute("y", by); badgeTxt.setAttribute("y", by + 13); badgeTxt.textContent = fmt(v);
      const info = opts.tooltip ? opts.tooltip(i, v) : { title: opts.labels ? opts.labels[i] : "", value: fmt(v) };
      tipT.textContent = info.title || ""; tipV.textContent = info.value || fmt(v);
      tipS.textContent = info.sub || ""; tipS.className = "s " + (info.subClass || ""); tipS.hidden = !info.sub;
      tip.hidden = false;
      const sx = host.clientWidth ? host.clientWidth / w : 1, sy = host.clientHeight ? host.clientHeight / h : 1;
      const tw = tip.offsetWidth || 120, th = tip.offsetHeight || 54;
      let left = pt[0] * sx + 14; if (left + tw > (host.clientWidth || w) - 4) left = pt[0] * sx - tw - 14;
      tip.style.left = Math.max(4, left) + "px";
      tip.style.top = Math.max(4, Math.min((host.clientHeight || h) - th - 4, pt[1] * sy - th / 2)) + "px";
    }
    function hide() {
      g.setAttribute("visibility", "hidden"); tip.hidden = true; if (lastDot) lastDot.setAttribute("opacity", "1");
    }
    function onMove(e) {
      const r = svg.getBoundingClientRect(), rw = r.width || w;
      host._hoverFrac = Math.max(0, Math.min(1, (e.clientX - r.left) / rw));
      show(host._hoverFrac);
    }
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerdown", onMove);
    svg.addEventListener("pointerleave", () => { host._hoverFrac = null; hide(); });
    if (host._hoverFrac != null) show(host._hoverFrac);     // chart was redrawn (live tick) while the pointer is still over it
  }

  /* Heatmap: absolutely positioned tiles using percentages (resizes by itself). */
  function heatmap(host, positions, onPick) {
    host.textContent = "";
    const items = positions.map((p) => ({ key: p.ticker, value: p.current_price * p.quantity, pnl: p.pnl_percent, pos: p }));
    const rects = L.treemap(items);
    if (!rects.length) {
      const d = document.createElement("div"); d.className = "empty"; d.textContent = "Your holdings appear here after your first trade.";
      host.appendChild(d); return;
    }
    rects.forEach((r) => {
      const t = document.createElement("div"); t.className = "tile";
      t.style.left = r.x * 100 + "%"; t.style.top = r.y * 100 + "%"; t.style.width = r.w * 100 + "%"; t.style.height = r.h * 100 + "%";
      t.style.background = L.pnlColor(r.pnl);
      const b = document.createElement("b"); b.textContent = r.key;
      const s = document.createElement("span"); s.textContent = L.pct(r.pnl) + "  " + L.money(r.value);
      t.title = r.key + ": " + L.money(r.value) + " (" + L.pct(r.pnl) + ")";
      t.appendChild(b); t.appendChild(s);
      t.addEventListener("click", () => onPick && onPick(r.key));
      host.appendChild(t);
    });
  }

  root.FACharts = { sparkline, lineChart, heatmap };
})(typeof self !== "undefined" ? self : this);
