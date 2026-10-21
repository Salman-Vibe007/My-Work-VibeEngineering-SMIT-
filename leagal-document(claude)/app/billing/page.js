'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Billing() {
  const [ready, setReady] = useState(false), [p, setP] = useState(null), [plan, setPlan] = useState(null);
  const [used, setUsed] = useState(0), [inv, setInv] = useState([]), [msg, setMsg] = useState('');
  useEffect(() => {
    (async () => {
      const sb = supabase();
      const s = sb && (await sb.auth.getSession()).data.session;
      if (!s) { setReady(true); return; }
      const { data: pr } = await sb.from('profiles').select('*').eq('id', s.user.id).maybeSingle(); setP(pr);
      const { data: pl } = await sb.from('plans').select('*').eq('id', (pr && pr.plan) || 'free').maybeSingle(); setPlan(pl);
      const m = new Date(); m.setUTCDate(1); m.setUTCHours(0, 0, 0, 0);
      const { count } = await sb.from('documents').select('id', { count: 'exact', head: true }).gte('created_at', m.toISOString()); setUsed(count || 0);
      const { data: iv } = await sb.from('invoices').select('*').order('created_at', { ascending: false }); setInv(iv || []);
      setReady(true);
    })();
  }, []);
  const portal = async () => {
    const { data } = await supabase().auth.getSession();
    const r = await fetch('/api/portal', { method: 'POST', headers: { Authorization: 'Bearer ' + data.session.access_token } });
    const j = await r.json();
    if (j.url) location.href = j.url; else setMsg(j.error || 'Something went wrong.');
  };
  if (!ready) return <p>Loading…</p>;
  if (!p) return <div className="card empty"><p><Link href="/login">Log in</Link> to see your plan and invoices.</p></div>;
  const pct = plan ? Math.min(100, Math.round(used / plan.monthly_docs * 100)) : 0;
  return (
    <>
      <h1 style={{ margin: '0 0 16px' }}>Billing</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Plan: {plan ? plan.name : p.plan} {p.subscription_status && <span className="pill ok">{p.subscription_status}</span>}</h3>
        <p style={{ color: 'var(--mu)' }}>Documents this month: <strong>{used}</strong> of {plan ? plan.monthly_docs : '?'}</p>
        <div style={{ height: 10, background: 'var(--bd)', borderRadius: 99 }}><div style={{ width: pct + '%', height: '100%', borderRadius: 99, background: pct >= 100 ? '#DC2626' : 'var(--pri)' }} /></div>
        <div className="row"><Link className="btn p" href="/pricing">Change plan</Link>{p.stripe_customer_id && <button className="btn" onClick={portal}>Manage / cancel subscription</button>}</div>
        {msg && <div className="msg bad">{msg}</div>}
      </div>
      <h2 style={{ margin: '0 0 8px' }}>Invoices</h2>
      {inv.length ? inv.map(i => (
        <div className="card dl" key={i.id} style={{ marginBottom: 8 }}>
          <span>{new Date(i.created_at).toLocaleDateString('en-GB')} · {(i.amount_paid / 100).toFixed(2)} {i.currency.toUpperCase()} · {i.status}</span>
          {i.hosted_invoice_url && <a className="btn s" href={i.hosted_invoice_url} target="_blank" rel="noreferrer">View invoice</a>}
        </div>)) : <p style={{ color: 'var(--mu)' }}>No invoices yet.</p>}
    </>
  );
}
