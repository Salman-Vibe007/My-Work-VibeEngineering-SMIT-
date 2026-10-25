"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, BadgeCheck, BarChart3, Calendar, Check, AlertCircle, Loader2, RefreshCw, Shield, ShieldCheck, Users, Wallet, ArrowDownLeft, Clock3 } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { formatDateTime, formatMoney } from "@/lib/utils";

type UserRow = { id: string; email: string; full_name: string | null; role: "user" | "admin"; created_at: string };
type TradeRow = { id: string; user_id: string; symbol: string; side: "buy" | "sell"; quantity: number; price: number; notional: number; created_at: string };
type AdminData = { metrics: { totalUsers: number; totalPaperTrades: number; newUsersThisWeek: number; totalVirtualCash: number }; users: UserRow[]; recentTrades: TradeRow[] };

async function readJson<T>(response: Response): Promise<T> {
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error ?? "Request failed.");
  return json as T;
}

export function AdminDashboard({ adminEmail, adminId }: { adminEmail: string; adminId: string }) {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyUser, setBusyUser] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await readJson<AdminData>(await fetch("/api/admin/overview", { cache: "no-store" }))); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load admin dashboard."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeRole(user: UserRow) {
    if (user.id === adminId) return;
    const role = user.role === "admin" ? "user" : "admin";
    if (!window.confirm(`${role === "admin" ? "Grant admin access to" : "Remove admin access from"} ${user.email}?`)) return;
    setBusyUser(user.id); setToast("");
    try {
      const updated = await readJson<{ user: UserRow }>(await fetch(`/api/admin/users/${user.id}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) }));
      setData((current) => current ? { ...current, users: current.users.map((row) => row.id === user.id ? updated.user : row) } : current);
      setToast(`Role updated for ${user.email}.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update role."); }
    finally { setBusyUser(""); }
  }

  return <div className="admin-shell"><aside className="admin-side"><Link href="/" className="brand-lockup sidebar-brand"><span className="brand-mark">F</span><span>FinAlly<span className="brand-dot">.</span><small>FINANCE, MADE CLEAR.</small></span></Link><div className="admin-side-label">ADMINISTRATION</div><div className="admin-nav-selected"><ShieldCheck size={17}/> Admin overview</div><Link className="admin-back-link" href="/dashboard"><ArrowLeft size={15}/> Back to workstation</Link><div className="sidebar-spacer"/><div className="admin-side-callout"><Shield size={17}/><strong>Restricted area</strong><small>Only accounts with the server-verified admin role can read these metrics.</small></div><div className="admin-mini-profile"><span className="avatar">{adminEmail.charAt(0).toUpperCase()}</span><span><b>{adminEmail}</b><small>Administrator</small></span></div><SignOutButton/></aside>
    <main className="admin-main"><header className="admin-topbar"><div><span className="section-kicker">SYSTEM CONTROL</span><h1>Admin overview<span className="title-period">.</span></h1><p>Monitor accounts and paper-trading activity across FinAlly.</p></div><button type="button" className="button button-secondary button-sm" onClick={load} disabled={loading}>{loading ? <Loader2 size={15} className="spin"/> : <RefreshCw size={15}/>} Refresh overview</button></header>
      {error && <div className="notice notice-error"><AlertCircle size={17}/><span>{error}</span></div>}{toast && <div className="notice notice-success"><Check size={17}/><span>{toast}</span></div>}
      {data && <><section className="admin-metrics"><AdminMetric label="REGISTERED USERS" value={data.metrics.totalUsers.toLocaleString()} note="Profiles in Supabase" icon={<Users size={18}/>} /><AdminMetric label="NEW THIS WEEK" value={data.metrics.newUsersThisWeek.toLocaleString()} note="Based on profile creation" icon={<Calendar size={18}/>} /><AdminMetric label="PAPER TRADES" value={data.metrics.totalPaperTrades.toLocaleString()} note="Simulated ledger entries" icon={<BarChart3 size={18}/>} /><AdminMetric label="VIRTUAL CASH" value={formatMoney(data.metrics.totalVirtualCash)} note="Combined virtual cash balances" icon={<Wallet size={18}/>} /></section>
      <section className="admin-card"><div className="admin-section-heading"><div><span className="panel-kicker"><Users size={13}/> PEOPLE</span><h2>User access</h2><p>Latest 100 profiles. Admin access changes apply immediately.</p></div><span className="admin-count">{data.users.length} shown</span></div><div className="table-scroll"><table className="admin-users-table"><thead><tr><th>USER</th><th>ROLE</th><th>JOINED</th><th>ACCESS CONTROL</th></tr></thead><tbody>{data.users.map((user) => <tr key={user.id}><td><div className="admin-user-cell"><span className="avatar avatar-small">{(user.full_name || user.email).charAt(0).toUpperCase()}</span><span><b>{user.full_name || "Unnamed user"}</b><small>{user.email}</small></span></div></td><td><span className={`role-pill role-${user.role}`}>{user.role === "admin" ? <ShieldCheck size={12}/> : <BadgeCheck size={12}/>} {user.role}</span></td><td>{formatDateTime(user.created_at)}</td><td><button type="button" className={`role-action ${user.role === "admin" ? "role-action-muted" : ""}`} onClick={() => changeRole(user)} disabled={user.id === adminId || busyUser === user.id}>{busyUser === user.id ? <Loader2 size={14} className="spin"/> : user.role === "admin" ? <Shield size={14}/> : <ShieldCheck size={14}/>} {user.id === adminId ? "Current admin" : user.role === "admin" ? "Remove admin" : "Make admin"}</button></td></tr>)}</tbody></table></div></section>
      <section className="admin-card"><div className="admin-section-heading"><div><span className="panel-kicker"><BarChart3 size={13}/> ACTIVITY</span><h2>Recent paper trades</h2><p>These are virtual ledger entries, not broker orders.</p></div><span className="paper-only-chip"><ShieldCheck size={13}/> PAPER ONLY</span></div><div className="table-scroll"><table><thead><tr><th>SYMBOL</th><th>SIDE</th><th>QUANTITY</th><th>PRICE</th><th>NOTIONAL</th><th>DATE</th></tr></thead><tbody>{data.recentTrades.length ? data.recentTrades.map((trade) => <tr key={trade.id}><td><b>{trade.symbol}</b></td><td><span className={`side-chip side-${trade.side}`}>{trade.side === "buy" ? <ArrowDownLeft size={12}/> : <ArrowUpRight size={12}/>} {trade.side}</span></td><td>{Number(trade.quantity).toLocaleString("en-US", { maximumFractionDigits: 6 })}</td><td>{formatMoney(Number(trade.price))}</td><td>{formatMoney(Number(trade.notional))}</td><td>{formatDateTime(trade.created_at)}</td></tr>) : <tr><td colSpan={6}><div className="admin-empty"><Clock3 size={20}/><span>No paper trades have been recorded yet.</span></div></td></tr>}</tbody></table></div></section></>}
      {!data && loading && <div className="admin-loading"><Loader2 size={25} className="spin"/><span>Loading protected metrics…</span></div>}
      <footer className="workspace-footer"><span>FinAlly Admin</span><span><ShieldCheck size={13}/> Admin API verifies the account role before reading service-role data.</span><Link href="/dashboard">Return to app <ArrowUpRight size={13}/></Link></footer>
    </main></div>;
}

function AdminMetric({ label, value, note, icon }: { label: string; value: string; note: string; icon: React.ReactNode }) {
  return <article className="admin-metric"><div className="admin-metric-icon">{icon}</div><span className="metric-label">{label}</span><strong>{value}</strong><small>{note}</small></article>;
}
