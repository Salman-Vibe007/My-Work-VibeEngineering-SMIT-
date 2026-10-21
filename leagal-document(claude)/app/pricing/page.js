'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Pricing() {
  const [plans, setPlans] = useState([]), [cur, setCur] = useState(null), [msg, setMsg] = useState('');
  useEffect(() => {
    const sb = supabase(); if (!sb) return;
    sb.from('plans').select('*').order('price_usd').then(({ data }) => setPlans(data || []));
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: p } = await sb.from('profiles').select('plan').eq('id', data.session.user.id).maybeSingle();
      setCur(p ? p.plan : 'free');
    });
  }, []);
  const buy = async id => {
    const { data } = await supabase().auth.getSession();
    if (!data.session) { location.href = '/login'; return; }
    const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.session.access_token }, body: JSON.stringify({ plan: id }) });
    const j = await r.json();
    if (j.url) location.href = j.url; else setMsg(j.error || 'Something went wrong.');
  };
  return (
    <>
      <h1 style={{ margin: 0 }}>Plans &amp; pricing</h1>
      <p style={{ color: 'var(--mu)' }}>Start free. Upgrade when you need more documents.</p>
      {msg && <div className="msg bad">{msg}</div>}
      {!plans.length && <p style={{ color: 'var(--mu)' }}>Plans load once Supabase is connected.</p>}
      <div className="grid3">
        {plans.map(p => (
          <article key={p.id} className="card tc">
            <span className="tag">{p.name}</span>
            <h3 style={{ fontSize: 34 }}>${p.price_usd}<small style={{ fontSize: 15, color: 'var(--mu)' }}> / month</small></h3>
            <p>{p.monthly_docs} documents per month<br />PDF, copy and text export<br />Share links and e-signing</p>
            {cur === p.id ? <span className="pill ok" style={{ alignSelf: 'flex-start' }}>Your current plan</span>
              : p.price_usd === 0 ? <span style={{ color: 'var(--mu)' }}>Included with every account</span>
              : <button className="btn p" onClick={() => buy(p.id)}>Subscribe</button>}
          </article>
        ))}
      </div>
    </>
  );
}
