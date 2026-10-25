"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bot, Briefcase, CheckCircle2, CircleHelp, Clock3, Layers, Loader2, Plus, RefreshCw, Search, Send, ShieldCheck, Sparkles, Trash2, TrendingDown, TrendingUp, Wallet, X } from "lucide-react";
import { CandlestickChart } from "@/components/candlestick-chart";
import { SignOutButton } from "@/components/sign-out-button";
import type { Account, MarketQuote, PaperTrade, Position, WatchlistItem } from "@/lib/types";
import { formatDateTime, formatMoney, formatPercent } from "@/lib/utils";

type PortfolioData = { account: Account; positions: Position[]; trades: PaperTrade[] };
type ChatMessage = { role: "user" | "assistant"; text: string };
type QuoteMap = Record<string, MarketQuote>;

const starterSymbols = ["AAPL", "MSFT", "NVDA", "GOOGL", "TSLA"];

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status}).`);
  return data as T;
}

export function DashboardClient({ email, fullName, isAdmin = false }: { email: string; fullName: string; isAdmin?: boolean }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(starterSymbols.map((symbol) => ({ symbol })));
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [marketError, setMarketError] = useState("");
  const [marketLoading, setMarketLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [watchInput, setWatchInput] = useState("");
  const [watchBusy, setWatchBusy] = useState(false);
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("1");
  const [tradeBusy, setTradeBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Welcome to your learning desk. Ask me to explain a chart concept or help interpret the selected symbol's latest quote. I won't place trades or provide personalized investment instructions." },
  ]);
  const [activeTab, setActiveTab] = useState<"positions" | "trades">("positions");
  const [mobileMenu, setMobileMenu] = useState(false);

  const refreshData = useCallback(async (showLoading = true) => {
    if (showLoading) setMarketLoading(true);
    try {
      const [watch, portfolioResponse] = await Promise.all([
        fetch("/api/watchlist", { cache: "no-store" }).then((r) => parseResponse<{ watchlist: WatchlistItem[] }>(r)),
        fetch("/api/portfolio", { cache: "no-store" }).then((r) => parseResponse<PortfolioData>(r)),
      ]);
      const list = watch.watchlist.length ? watch.watchlist : starterSymbols.map((symbol) => ({ symbol }));
      setWatchlist(list);
      setPortfolio(portfolioResponse);
      setSelectedSymbol((current) => list.some((item) => item.symbol === current) || (portfolioResponse.positions ?? []).some((item) => item.symbol === current) ? current : (list[0]?.symbol ?? "AAPL"));
      const symbols = [...new Set([...list.map((item) => item.symbol), ...(portfolioResponse.positions ?? []).map((item) => item.symbol)])].slice(0, 12);
      const quoteResults = await Promise.all(symbols.map(async (symbol) => {
        try {
          const quote = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" }).then((r) => parseResponse<MarketQuote>(r));
          return [symbol, quote] as const;
        } catch (error) { return [symbol, error instanceof Error ? error.message : "Quote unavailable"] as const; }
      }));
      const nextQuotes: QuoteMap = {};
      const failures: string[] = [];
      for (const [symbol, value] of quoteResults) {
        if (typeof value === "string") failures.push(`${symbol}: ${value}`);
        else nextQuotes[symbol] = value;
      }
      setQuotes(nextQuotes);
      setMarketError(failures.length ? failures[0].replace(/^\w+: /, "") : "");
      setLastRefresh(new Date());
    } catch (error) {
      setMarketError(error instanceof Error ? error.message : "Could not load your workspace.");
    } finally { if (showLoading) setMarketLoading(false); }
  }, []);

  useEffect(() => {
    refreshData(true);
    const timer = window.setInterval(() => refreshData(false), 90000);
    return () => window.clearInterval(timer);
  }, [refreshData]);

  const selectedQuote = quotes[selectedSymbol];
  const positionValue = useMemo(() => (portfolio?.positions ?? []).reduce((sum, position) => sum + position.quantity * (quotes[position.symbol]?.price ?? 0), 0), [portfolio, quotes]);
  const costBasis = useMemo(() => (portfolio?.positions ?? []).reduce((sum, position) => sum + position.quantity * position.average_price, 0), [portfolio]);
  const allPositionsQuoted = (portfolio?.positions ?? []).every((position) => Boolean(quotes[position.symbol]));
  const unrealizedPnl = allPositionsQuoted ? positionValue - costBasis : null;
  const virtualCash = Number(portfolio?.account?.virtual_cash ?? 10000);
  const totalValue = allPositionsQuoted ? virtualCash + positionValue : null;
  const signedPnlPct = costBasis > 0 && unrealizedPnl !== null ? unrealizedPnl / costBasis * 100 : null;

  async function addSymbol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const symbol = watchInput.trim().toUpperCase();
    if (!symbol) return;
    setWatchBusy(true); setNotice(null);
    try {
      await parseResponse(await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol }) }));
      setWatchInput(""); await refreshData(false); setSelectedSymbol(symbol);
      setNotice({ type: "success", text: `${symbol} added to your watchlist.` });
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not add symbol." }); }
    finally { setWatchBusy(false); }
  }

  async function removeSymbol(symbol: string) {
    if (watchlist.length <= 1) { setNotice({ type: "error", text: "Keep at least one symbol in your watchlist." }); return; }
    try {
      await parseResponse(await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: "DELETE" }));
      await refreshData(false);
      if (selectedSymbol === symbol) setSelectedSymbol(watchlist.find((item) => item.symbol !== symbol)?.symbol ?? "AAPL");
      setNotice({ type: "success", text: `${symbol} removed from your watchlist.` });
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not remove symbol." }); }
  }

  async function submitTrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice(null);
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) { setNotice({ type: "error", text: "Enter a positive quantity." }); return; }
    const verb = tradeSide === "buy" ? "Buy" : "Sell";
    if (!window.confirm(`${verb} ${qty} share(s) of ${selectedSymbol} in your SIMULATED portfolio at the latest provider quote? No real order will be placed.`)) return;
    setTradeBusy(true);
    try {
      const data = await parseResponse<{ message: string }>(await fetch("/api/trades", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol: selectedSymbol, side: tradeSide, quantity: qty }) }));
      setNotice({ type: "success", text: data.message }); setQuantity("1"); await refreshData(false); setActiveTab("trades");
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Paper trade failed." }); }
    finally { setTradeBusy(false); }
  }

  async function sendChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const message = chatInput.trim();
    if (!message || chatBusy) return;
    setChatMessages((items) => [...items, { role: "user", text: message }]); setChatInput(""); setChatBusy(true);
    try {
      const data = await parseResponse<{ answer: string }>(await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, symbol: selectedSymbol }) }));
      setChatMessages((items) => [...items, { role: "assistant", text: data.answer }]);
    } catch (error) { setChatMessages((items) => [...items, { role: "assistant", text: error instanceof Error ? error.message : "The learning assistant is unavailable." }]); }
    finally { setChatBusy(false); }
  }

  const displayName = fullName.trim() || email.split("@")[0] || "there";

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <Link href="/" className="brand-lockup sidebar-brand"><span className="brand-mark">F</span><span>FinAlly<span className="brand-dot">.</span><small>FINANCE, MADE CLEAR.</small></span></Link>
      <div className="side-section-title">WORKSPACE</div>
      <nav className="sidebar-nav"><a href="#overview" className="side-link active"><Layers size={17}/><span>Overview</span><span className="side-link-dot"/></a><a href="#market" className="side-link"><Activity size={17}/><span>Market explorer</span></a><a href="#portfolio" className="side-link"><Briefcase size={17}/><span>Paper portfolio</span></a><a href="#assistant" className="side-link"><Bot size={17}/><span>AI companion</span><span className="new-pill">AI</span></a>{isAdmin && <Link href="/admin" className="side-link"><ShieldCheck size={17}/><span>Admin console</span></Link>}</nav>
      <div className="sidebar-spacer"/>
      <div className="paper-account-card"><div className="paper-card-icon"><Wallet size={17}/></div><span className="tiny-label">PAPER ACCOUNT</span><strong>{formatMoney(virtualCash)}</strong><span className="paper-account-caption"><span/> Virtual cash balance</span></div>
      <div className="profile-mini"><div className="avatar">{displayName.charAt(0).toUpperCase()}</div><div className="profile-copy"><strong>{displayName}</strong><small title={email}>{email}</small></div><SignOutButton compact/></div>
    </aside>

    <main className="main-workspace">
      <header className="topbar"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenu((v) => !v)}><Layers size={19}/></button><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Overview</strong></div><div className="topbar-right"><span className={`market-open-badge ${marketError ? "market-badge-error" : ""}`}><span/> {marketError ? "FEED NEEDS SETUP" : lastRefresh ? "FEED CHECKED" : "MARKET DATA"}</span><span className="topbar-divider"/><span className="topbar-user">{email}</span><div className="avatar avatar-small">{displayName.charAt(0).toUpperCase()}</div><button className="icon-button" type="button" aria-label="Refresh workspace" onClick={() => refreshData(true)}><RefreshCw size={16}/></button></div></header>

      <div className="workspace-content" id="overview">
        <section className="welcome-row"><div><span className="section-kicker">YOUR FINANCIAL LEARNING DESK</span><h1>Good day, {displayName.split(" ")[0]}<span className="title-period">.</span></h1><p>Markets change. Understanding compounds. Let&apos;s see what the data says.</p></div><div className="welcome-meta"><span className="market-update"><Clock3 size={14}/> Updated {lastRefresh ? lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span><button type="button" className="button button-secondary button-sm" onClick={() => refreshData(true)} disabled={marketLoading}>{marketLoading ? <Loader2 className="spin" size={15}/> : <RefreshCw size={15}/>} Refresh data</button></div></section>

        {notice && <div className={`notice notice-${notice.type}`} role="status">{notice.type === "success" ? <CheckCircle2 size={17}/> : <CircleHelp size={17}/>}<span>{notice.text}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={15}/></button></div>}
        {marketError && <div className="market-alert"><div className="market-alert-icon"><Activity size={17}/></div><div><strong>Market feed needs attention</strong><p>{marketError}</p><small>To show current provider data, configure TWELVE_DATA_API_KEY in Vercel and redeploy. No fabricated prices are displayed.</small></div></div>}

        <section className="metrics-grid">
          <MetricCard label="TOTAL PAPER VALUE" value={totalValue === null ? "—" : formatMoney(totalValue)} note={allPositionsQuoted ? "Cash + current position value" : "Waiting for quotes on all positions"} icon={<Wallet size={17}/>} tone="teal" badge="SIMULATED"/>
          <MetricCard label="VIRTUAL CASH" value={formatMoney(virtualCash)} note="Available for paper buys" icon={<CircleHelp size={17}/>} tone="pale"/>
          <MetricCard label="POSITION VALUE" value={allPositionsQuoted ? formatMoney(positionValue) : "—"} note={`${portfolio?.positions.length ?? 0} open positions`} icon={<Briefcase size={17}/>} tone="gold"/>
          <MetricCard label="UNREALIZED P/L" value={unrealizedPnl === null ? "—" : `${unrealizedPnl >= 0 ? "+" : "−"}${formatMoney(Math.abs(unrealizedPnl))}`} note={unrealizedPnl === null ? "Waiting for current quotes" : costBasis > 0 ? `${formatPercent(signedPnlPct ?? 0)} on current holdings` : "No open positions"} icon={unrealizedPnl === null ? <CircleHelp size={17}/> : unrealizedPnl >= 0 ? <TrendingUp size={17}/> : <TrendingDown size={17}/>} tone={unrealizedPnl !== null && unrealizedPnl < 0 ? "gold" : "pale"} positive={unrealizedPnl === null ? null : unrealizedPnl >= 0}/>
        </section>

        <section className="market-layout" id="market">
          <div className="market-main-column">
            <div className="selected-asset-panel panel"><div className="selected-asset-left"><div className="asset-logo">{selectedSymbol.slice(0, 1)}</div><div><div className="asset-title-row"><h2>{selectedSymbol}</h2><span className="asset-exchange">{selectedQuote?.exchange ?? "US EQUITY"}</span></div><p>{selectedQuote?.name ?? "Select a watchlist symbol"}</p></div></div><div className="selected-asset-right">{selectedQuote ? <><strong>{formatMoney(selectedQuote.price, selectedQuote.currency)}</strong><span className={selectedQuote.change >= 0 ? "positive" : "negative"}>{selectedQuote.change >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>} {selectedQuote.change >= 0 ? "+" : ""}{selectedQuote.change.toFixed(2)} ({formatPercent(selectedQuote.percentChange)})</span><small>Quote timestamp: {formatDateTime(selectedQuote.timestamp)}</small></> : <><strong className="quote-placeholder">— —</strong><span className="muted-text">Quote unavailable</span><small>Data comes from your configured provider</small></>}</div></div>
            <CandlestickChart symbol={selectedSymbol}/>

            <section className="panel portfolio-panel" id="portfolio"><div className="panel-heading"><div><span className="panel-kicker"><Briefcase size={13}/> YOUR LEDGER</span><h2>Paper portfolio</h2></div><span className="paper-only-chip"><ShieldCheck size={13}/> PAPER ONLY</span></div><div className="table-tabs"><button type="button" className={activeTab === "positions" ? "table-tab-active" : ""} onClick={() => setActiveTab("positions")}>Open positions <span>{portfolio?.positions.length ?? 0}</span></button><button type="button" className={activeTab === "trades" ? "table-tab-active" : ""} onClick={() => setActiveTab("trades")}>Recent paper trades <span>{portfolio?.trades.length ?? 0}</span></button></div>
              {activeTab === "positions" ? <div className="table-scroll"><table><thead><tr><th>ASSET</th><th>SHARES</th><th>AVG. COST</th><th>MARKET PRICE</th><th>UNREALIZED P/L</th></tr></thead><tbody>{portfolio?.positions.length ? portfolio.positions.map((pos) => { const quote = quotes[pos.symbol]; const pnl = quote ? (quote.price - pos.average_price) * pos.quantity : null; return <tr key={pos.symbol}><td><button className="table-symbol-button" onClick={() => setSelectedSymbol(pos.symbol)} type="button"><span className="symbol-mini">{pos.symbol.slice(0, 1)}</span><span><b>{pos.symbol}</b><small>{quote?.name ?? "Equity"}</small></span></button></td><td>{Number(pos.quantity).toLocaleString("en-US", { maximumFractionDigits: 6 })}</td><td>{formatMoney(Number(pos.average_price))}</td><td>{quote ? formatMoney(quote.price) : <span className="muted-text">No quote</span>}</td><td className={pnl === null ? "muted-text" : pnl >= 0 ? "positive" : "negative"}>{pnl === null ? "—" : `${pnl >= 0 ? "+" : "−"}${formatMoney(Math.abs(pnl))}`}</td></tr>; }) : <tr><td colSpan={5}><EmptyState title="Your positions start here" body="Use the paper ticket to record a simulated buy. No real order is sent."/></td></tr>}</tbody></table></div> : <div className="table-scroll"><table><thead><tr><th>ASSET</th><th>TYPE</th><th>QUANTITY</th><th>PRICE</th><th>TIME</th></tr></thead><tbody>{portfolio?.trades.length ? portfolio.trades.map((trade) => <tr key={trade.id}><td><b>{trade.symbol}</b></td><td><span className={`side-chip side-${trade.side}`}>{trade.side}</span></td><td>{Number(trade.quantity).toLocaleString("en-US", { maximumFractionDigits: 6 })}</td><td>{formatMoney(Number(trade.price))}</td><td>{formatDateTime(trade.created_at)}</td></tr>) : <tr><td colSpan={5}><EmptyState title="No paper trades yet" body="Your simulated orders will appear here after you place one."/></td></tr>}</tbody></table></div>}
            </section>
          </div>

          <aside className="market-side-column">
            <section className="panel watchlist-panel"><div className="panel-heading"><div><span className="panel-kicker"><Activity size={13}/> MARKET LIST</span><h2>Watchlist <span className="heading-count">{watchlist.length}</span></h2></div><button className="icon-button" type="button" aria-label="Refresh watchlist" onClick={() => refreshData(true)}><RefreshCw size={15}/></button></div><form className="watch-add-form" onSubmit={addSymbol}><div className="watch-input-wrap"><Search size={15}/><input value={watchInput} onChange={(e) => setWatchInput(e.target.value)} maxLength={10} placeholder="Add ticker (e.g. AMD)" aria-label="Ticker symbol"/></div><button type="submit" disabled={watchBusy || !watchInput.trim()} aria-label="Add symbol" className="watch-add-btn">{watchBusy ? <Loader2 size={16} className="spin"/> : <Plus size={17}/>}</button></form><div className="watchlist-items">{watchlist.map((item) => { const quote = quotes[item.symbol]; return <div className={`watch-item ${selectedSymbol === item.symbol ? "watch-item-selected" : ""}`} key={item.symbol}><button type="button" className="watch-item-main" onClick={() => setSelectedSymbol(item.symbol)}><span className="symbol-mini">{item.symbol.slice(0, 1)}</span><span className="watch-symbol-copy"><b>{item.symbol}</b><small>{quote?.name ?? "Market symbol"}</small></span></button><div className="watch-quote">{quote ? <><b>{formatMoney(quote.price)}</b><small className={quote.percentChange >= 0 ? "positive" : "negative"}>{formatPercent(quote.percentChange)}</small></> : <><b className="quote-placeholder">—</b><small className="muted-text">No quote</small></>}</div><button type="button" className="watch-remove" aria-label={`Remove ${item.symbol}`} title={`Remove ${item.symbol}`} onClick={() => removeSymbol(item.symbol)}><Trash2 size={14}/></button></div>; })}</div><div className="watchlist-footer"><span><span className="status-dot"/> Refreshes about every 90 sec</span><span className="watch-provider">Twelve Data</span></div></section>

            <section className="panel order-panel"><div className="panel-heading"><div><span className="panel-kicker"><ArrowLeftRight size={13}/> SIMULATED ORDER</span><h2>Paper ticket</h2></div><span className="lock-chip"><ShieldCheck size={13}/></span></div><div className="order-warning"><ShieldCheck size={15}/><span>Practice mode. This never sends an order to a broker.</span></div><div className="order-symbol-row"><div><small>SELECTED SYMBOL</small><strong>{selectedSymbol}</strong></div><div className="order-price">{selectedQuote ? formatMoney(selectedQuote.price) : "—"}<small>Latest available quote</small></div></div><div className="trade-side-control"><button type="button" onClick={() => setTradeSide("buy")} className={tradeSide === "buy" ? "trade-side-buy-active" : ""}><ArrowDownLeft size={15}/> Paper buy</button><button type="button" onClick={() => setTradeSide("sell")} className={tradeSide === "sell" ? "trade-side-sell-active" : ""}><ArrowUpRight size={15}/> Paper sell</button></div><form onSubmit={submitTrade} className="order-form"><label>Share quantity<input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="0.000001" max="100000" step="0.000001" required/></label><div className="order-estimate"><span>Estimated notional</span><b>{selectedQuote && Number(quantity) > 0 ? formatMoney(selectedQuote.price * Number(quantity)) : "—"}</b></div><button type="submit" className={`button ${tradeSide === "buy" ? "button-primary" : "button-sell"} order-submit`} disabled={tradeBusy || !selectedQuote}>{tradeBusy ? <Loader2 className="spin" size={16}/> : <>{tradeSide === "buy" ? "Simulate buy" : "Simulate sell"}<ArrowRightIcon/></>}</button><p className="order-disclaimer">Filled against a server-fetched provider quote and recorded to your virtual ledger.</p></form></section>

            <section className="ai-panel panel" id="assistant"><div className="ai-panel-heading"><div className="ai-avatar"><Sparkles size={16}/></div><div><span className="panel-kicker">FINALLY AI</span><h2>Market companion</h2></div><span className="ai-readonly">READ ONLY</span></div><p className="ai-intro">Ask a question about {selectedSymbol}, price charts, or portfolio basics. Answers use the selected symbol&apos;s latest provider quote when available.</p><div className="chat-messages" aria-live="polite">{chatMessages.map((message, index) => <div className={`chat-message chat-${message.role}`} key={`${index}-${message.role}`}><span className="chat-avatar">{message.role === "assistant" ? <Bot size={13}/> : displayName.charAt(0).toUpperCase()}</span><p>{message.text}</p></div>)}{chatBusy && <div className="chat-message chat-assistant"><span className="chat-avatar"><Bot size={13}/></span><p className="typing-dots"><i/><i/><i/></p></div>}</div><div className="chat-suggestions"><button type="button" onClick={() => setChatInput(`Explain what the latest ${selectedSymbol} candle might tell a beginner.`)}>Explain this candle</button><button type="button" onClick={() => setChatInput("Explain unrealized P/L in simple terms.")}>What is P/L?</button></div><form className="chat-form" onSubmit={sendChat}><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} maxLength={1200} placeholder="Ask a learning question…" aria-label="Ask AI companion"/><button type="submit" aria-label="Send question" disabled={chatBusy || !chatInput.trim()}><Send size={16}/></button></form><div className="ai-disclaimer"><ShieldCheck size={12}/> Educational explanations only, not financial advice.</div></section>
          </aside>
        </section>

        <footer className="workspace-footer"><span>FinAlly · Finance, made clear.</span><span><ShieldCheck size={13}/> Virtual trades only · Market data may be delayed depending on your provider plan.</span><span>Market data: Twelve Data</span></footer>
      </div>
    </main>
  </div>;
}

function MetricCard({ label, value, note, icon, tone, badge, positive }: { label: string; value: string; note: string; icon: ReactNode; tone: string; badge?: string; positive?: boolean | null }) {
  const valueClass = label === "UNREALIZED P/L" && positive !== null ? positive ? "positive" : "negative" : "";
  return <article className={`metric-card metric-${tone}`}><div className="metric-top"><span className="metric-icon">{icon}</span>{badge && <span className="metric-badge">{badge}</span>}</div><span className="metric-label">{label}</span><strong className={valueClass}>{value}</strong><small>{note}</small></article>;
}

function EmptyState({ title, body }: { title: string; body: string }) { return <div className="empty-state"><span><Briefcase size={18}/></span><strong>{title}</strong><small>{body}</small></div>; }
function ArrowRightIcon() { return <ArrowUpRight size={16}/>; }
