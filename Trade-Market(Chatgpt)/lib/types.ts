export type MarketQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  timestamp: string;
  currency: string;
  exchange: string;
  source: "Twelve Data";
};

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type WatchlistItem = { symbol: string; created_at?: string };
export type Position = {
  symbol: string;
  quantity: number;
  average_price: number;
  updated_at: string;
};
export type Account = { user_id: string; virtual_cash: number; updated_at: string };
export type PaperTrade = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  notional: number;
  created_at: string;
};
