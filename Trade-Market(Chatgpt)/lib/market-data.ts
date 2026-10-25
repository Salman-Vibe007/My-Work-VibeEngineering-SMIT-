import type { Candle, MarketQuote } from "@/lib/types";

const BASE_URL = "https://api.twelvedata.com";

export class MarketDataError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "MarketDataError";
    this.status = status;
  }
}

function requiredApiKey() {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key || key === "YOUR_TWELVE_DATA_API_KEY") {
    throw new MarketDataError("Live market data is not configured. Add TWELVE_DATA_API_KEY to your server environment, then redeploy.", 503);
  }
  return key;
}

async function providerJson(url: URL) {
  const response = await fetch(url, { next: { revalidate: 20 } });
  let data: unknown;
  try { data = await response.json(); } catch { throw new MarketDataError("The market-data provider returned an unreadable response."); }
  if (!response.ok) throw new MarketDataError(`Market-data provider request failed (${response.status}).`, response.status === 429 ? 429 : 502);
  if (data && typeof data === "object" && "status" in data && (data as { status?: string }).status === "error") {
    const message = "message" in data ? String((data as { message: unknown }).message) : "Provider error.";
    const code = "code" in data ? Number((data as { code: unknown }).code) : 502;
    const status = code === 429 || code === 4290 ? 429 : code === 401 || code === 403 ? 502 : 502;
    throw new MarketDataError(message, status);
  }
  return data as Record<string, unknown>;
}

export async function getQuote(symbol: string): Promise<MarketQuote> {
  const url = new URL(`${BASE_URL}/quote`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", requiredApiKey());
  const data = await providerJson(url);
  const price = Number(data.close ?? data.price);
  if (!Number.isFinite(price) || price <= 0) throw new MarketDataError(`No valid price returned for ${symbol}. Check the symbol and provider entitlements.`);
  return {
    symbol,
    name: typeof data.name === "string" && data.name ? data.name : symbol,
    price,
    change: Number(data.change ?? 0),
    percentChange: Number(data.percent_change ?? 0),
    timestamp: typeof data.datetime === "string" ? data.datetime : new Date().toISOString(),
    currency: typeof data.currency === "string" && data.currency ? data.currency : "USD",
    exchange: typeof data.exchange === "string" ? data.exchange : "Market",
    source: "Twelve Data",
  };
}

export async function getCandles(symbol: string, period: string): Promise<{ candles: Candle[]; interval: string; provider: string }> {
  const configs: Record<string, { interval: string; outputsize: string }> = {
    "1D": { interval: "5min", outputsize: "78" },
    "1W": { interval: "30min", outputsize: "100" },
    "1M": { interval: "1day", outputsize: "30" },
    "3M": { interval: "1day", outputsize: "90" },
    "1Y": { interval: "1day", outputsize: "252" },
  };
  const config = configs[period] ?? configs["1M"];
  const url = new URL(`${BASE_URL}/time_series`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", config.interval);
  url.searchParams.set("outputsize", config.outputsize);
  url.searchParams.set("order", "ASC");
  url.searchParams.set("apikey", requiredApiKey());
  const data = await providerJson(url);
  if (!Array.isArray(data.values)) {
    throw new MarketDataError(`No historical candles were returned for ${symbol}. Check the symbol and market-data plan.`);
  }
  const candles: Candle[] = (data.values as Array<Record<string, unknown>>).map((row) => {
    const rawTime = String(row.datetime ?? "");
    const normalizedTime = /^\d{4}-\d{2}-\d{2}$/.test(rawTime) ? `${rawTime}T00:00:00Z` : rawTime.replace(" ", "T") + (/[zZ]|[+-]\d{2}:?\d{2}$/.test(rawTime) ? "" : "Z");
    return {
      time: Math.floor(new Date(normalizedTime).getTime() / 1000),
      open: Number(row.open), high: Number(row.high), low: Number(row.low), close: Number(row.close), volume: Number(row.volume ?? 0),
    };
  }).filter((c) => Number.isFinite(c.time) && Number.isFinite(c.open) && Number.isFinite(c.high) && Number.isFinite(c.low) && Number.isFinite(c.close) && c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0).sort((a, b) => a.time - b.time);
  return { candles, interval: config.interval, provider: "Twelve Data" };
}
