"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Loader2, RefreshCw } from "lucide-react";
import { createChart, CandlestickSeries, ColorType, CrosshairMode, type CandlestickData, type IChartApi, type ISeriesApi, type Time, type UTCTimestamp } from "lightweight-charts";
import type { Candle } from "@/lib/types";
import { formatMoney, formatDateTime } from "@/lib/utils";

type Period = "1D" | "1W" | "1M" | "3M" | "1Y";
type HoverCandle = Candle & { x: number; y: number };

export function CandlestickChart({ symbol, refreshToken = 0 }: { symbol: string; refreshToken?: number }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [period, setPeriod] = useState<Period>("1M");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [hover, setHover] = useState<HoverCandle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartWidth, setChartWidth] = useState(640);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(""); setHover(null);
      try {
        const response = await fetch(`/api/market/candles?symbol=${encodeURIComponent(symbol)}&period=${period}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load chart data.");
        if (!cancelled) {
          setCandles(Array.isArray(data.candles) ? data.candles : []);
          if (!data.candles?.length) setError("No chart data is available for this symbol and period.");
        }
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load chart data."); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [symbol, period, refreshToken, revision]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const chart = createChart(host, {
      width: Math.max(host.clientWidth, 300),
      height: 330,
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "#FCFDFB" }, textColor: "#738783", fontFamily: "Inter, ui-sans-serif, system-ui", fontSize: 11 },
      grid: { vertLines: { color: "rgba(27,69,67,0.055)" }, horzLines: { color: "rgba(27,69,67,0.075)" } },
      rightPriceScale: { borderColor: "rgba(27,69,67,0.12)", scaleMargins: { top: 0.12, bottom: 0.12 } },
      timeScale: { borderColor: "rgba(27,69,67,0.12)", timeVisible: true, secondsVisible: false, rightOffset: 4 },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: "#1B4543", width: 1, style: 2, labelBackgroundColor: "#1B4543" }, horzLine: { color: "#1B4543", width: 1, style: 2, labelBackgroundColor: "#1B4543" } },
      localization: { priceFormatter: (price: number) => `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#1B4543", downColor: "#F0BE6F", borderUpColor: "#1B4543", borderDownColor: "#D6A653",
      wickUpColor: "#1B4543", wickDownColor: "#D6A653",
    });
    chartRef.current = chart;
    seriesRef.current = series;
    setChartWidth(host.clientWidth);

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) { setHover(null); return; }
      const item = param.seriesData.get(series) as CandlestickData<Time> | undefined;
      if (!item || typeof item.time !== "number") { setHover(null); return; }
      const time = Number(item.time);
      setHover({ time, open: item.open, high: item.high, low: item.low, close: item.close, volume: 0, x: param.point.x, y: param.point.y });
    });
    const resizeObserver = new ResizeObserver(() => setChartWidth(host.clientWidth));
    resizeObserver.observe(host);
    return () => {
      resizeObserver.disconnect();
      chart.remove(); chartRef.current = null; seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;
    const data = candles.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })) as CandlestickData<Time>[];
    try { series.setData(data); chart.timeScale().fitContent(); } catch { setError("Chart could not parse the provider's candle timestamps."); }
  }, [candles]);

  const active = hover ?? (candles.length ? { ...candles[candles.length - 1], x: 12, y: 12 } : null);
  const tooltipLeft = hover ? Math.max(8, Math.min(hover.x + 14, chartWidth - 198)) : 12;
  const tooltipTop = hover ? Math.max(8, Math.min(hover.y - 88, 158)) : 12;

  return <section className="chart-panel panel">
    <div className="panel-heading chart-heading"><div><span className="panel-kicker"><Activity size={13}/> PRICE ACTION</span><h2>{symbol} price chart <span className="chart-subtitle">OHLC · {period}</span></h2></div><div className="chart-controls"><div className="period-tabs" role="group" aria-label="Chart period">{(["1D", "1W", "1M", "3M", "1Y"] as Period[]).map((p) => <button type="button" key={p} className={period === p ? "period-active" : ""} onClick={() => setPeriod(p)}>{p}</button>)}</div><button type="button" className="icon-button" aria-label="Refresh chart" onClick={() => setRevision((v) => v + 1)}><RefreshCw size={15}/></button></div></div>
    <div className="chart-summary">{active ? <><span><small>OPEN</small><b>{formatMoney(active.open)}</b></span><span><small>HIGH</small><b>{formatMoney(active.high)}</b></span><span><small>LOW</small><b>{formatMoney(active.low)}</b></span><span><small>CLOSE</small><b className={active.close >= active.open ? "positive" : "negative"}>{formatMoney(active.close)}</b></span></> : <span className="chart-summary-empty">Hover over a candle to inspect OHLC values.</span>}</div>
    <div className="chart-canvas">
      <div className="chart-host" ref={hostRef}/>
      {hover && !error && !loading && <div className="chart-hover-card" style={{ left: tooltipLeft, top: tooltipTop }}><div className="hover-date">{formatDateTime(hover.time * 1000)}</div><div className="hover-row"><span>Open</span><strong>{formatMoney(hover.open)}</strong></div><div className="hover-row"><span>High</span><strong>{formatMoney(hover.high)}</strong></div><div className="hover-row"><span>Low</span><strong>{formatMoney(hover.low)}</strong></div><div className="hover-row"><span>Close</span><strong className={hover.close >= hover.open ? "positive" : "negative"}>{formatMoney(hover.close)}</strong></div></div>}
      {loading && <div className="chart-overlay"><Loader2 className="spin" size={23}/><span>Loading verified market candles…</span></div>}
      {!loading && error && <div className="chart-overlay chart-error"><Activity size={23}/><strong>Chart data unavailable</strong><span>{error}</span><button className="button button-secondary button-sm" type="button" onClick={() => setRevision((v) => v + 1)}>Try again</button></div>}
    </div>
    <div className="chart-footnote"><span><i className="legend-candle-up"/> Up close <i className="legend-candle-down"/> Down close</span><span>Crosshair enabled · Hover for OHLC · <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">Charts by TradingView</a></span></div>
  </section>;
}
