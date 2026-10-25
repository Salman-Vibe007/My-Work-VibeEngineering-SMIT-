import Link from "next/link";
import { Activity, ArrowRight, Bot, TrendingUp, CircleDollarSign, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  let signedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } catch { /* Public landing page remains available before configuration. */ }

  return <main className="landing-shell">
    <nav className="landing-nav">
      <Link href="/" className="brand-lockup"><span className="brand-mark">F</span><span>FinAlly<span className="brand-dot">.</span><small>FINANCE, MADE CLEAR.</small></span></Link>
      <div className="nav-actions"><Link href="/login" className="nav-login">Log in</Link><Link href={signedIn ? "/dashboard" : "/signup"} className="button button-primary">{signedIn ? "Open workstation" : "Create account"}<ArrowRight size={16}/></Link></div>
    </nav>

    <section className="hero-grid">
      <div className="hero-copy">
        <div className="eyebrow"><span className="status-dot"/> LIVE MARKET DATA · SIMULATED PORTFOLIO</div>
        <h1>Understand the market.<br/><em>Practice with purpose.</em></h1>
        <p className="hero-lede">A calm, intelligent workspace to explore market movements, study price action, and learn portfolio basics — without risking real money.</p>
        <div className="hero-actions"><Link href={signedIn ? "/dashboard" : "/signup"} className="button button-primary button-lg">Launch your workstation <ArrowRight size={18}/></Link><Link href="/login" className="button button-quiet button-lg">I already have an account</Link></div>
        <div className="hero-proof"><ShieldCheck size={17}/><span>Real market data from your configured provider. All orders are virtual.</span></div>
      </div>
      <div className="hero-visual" aria-label="Illustration of the market workstation">
        <div className="visual-top"><span className="window-dots"><i/><i/><i/></span><span className="visual-tag"><Activity size={12}/> MARKET OVERVIEW</span><span className="live-pill"><span/> FEED</span></div>
        <div className="visual-symbol-row"><div><span className="muted-label">SELECTED ASSET</span><h3>AAPL <span>Apple Inc.</span></h3></div><div className="demo-price"><strong>$—</strong><small>Connect live feed</small></div></div>
        <div className="mock-chart"><div className="chart-lines"><i/><i/><i/><i/></div><svg viewBox="0 0 520 180" role="img" aria-label="Decorative market chart illustration"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1B4543" stopOpacity=".22"/><stop offset="100%" stopColor="#1B4543" stopOpacity="0"/></linearGradient></defs><path d="M0 132 C20 128 25 108 45 116 S72 145 90 119 S114 90 133 99 S161 75 180 83 S212 118 232 93 S263 59 282 67 S315 91 337 54 S370 64 393 45 S427 54 447 29 S480 38 520 16 L520 180 L0 180 Z" fill="url(#area)"/><path d="M0 132 C20 128 25 108 45 116 S72 145 90 119 S114 90 133 99 S161 75 180 83 S212 118 232 93 S263 59 282 67 S315 91 337 54 S370 64 393 45 S427 54 447 29 S480 38 520 16" fill="none" stroke="#1B4543" strokeWidth="3" strokeLinecap="round"/><circle cx="447" cy="29" r="5" fill="#F0BE6F" stroke="#fff" strokeWidth="3"/></svg><div className="mock-axis"><span>09:30</span><span>11:00</span><span>12:30</span><span>14:00</span><span>16:00</span></div></div>
        <div className="visual-bottom"><div><small>VIRTUAL CASH</small><strong>$10,000.00</strong></div><div><small>MARKET FEED</small><strong className="feed-setup">API setup required</strong></div><div><small>TRADING MODE</small><strong>Paper only</strong></div></div>
        <div className="floating-note"><span className="float-icon"><Bot size={16}/></span><span><strong>AI market companion</strong><small>Read-only learning assistant</small></span></div>
      </div>
    </section>

    <section className="value-strip"><div><TrendingUp/><span><strong>Interactive charts</strong><small>Crosshair, OHLC tooltip & period controls</small></span></div><div><CircleDollarSign/><span><strong>Virtual portfolio</strong><small>Paper trades with server-side validation</small></span></div><div><ShieldCheck/><span><strong>Private by design</strong><small>Supabase Auth and row-level security</small></span></div></section>

    <section className="landing-bottom"><div><span className="section-kicker">YOUR WORKSPACE, YOUR PACE</span><h2>Build understanding before making decisions.</h2></div><p>FinAlly brings live market information, portfolio tracking, and a read-only AI explainer into one accessible experience. Quotes may be real-time or delayed according to the market-data provider plan you configure.</p></section>
    <footer className="landing-footer"><span>© {new Date().getFullYear()} FinAlly</span><span>Educational paper-trading workspace · Not investment advice</span><span>Built with Supabase + Vercel</span></footer>
  </main>;
}
