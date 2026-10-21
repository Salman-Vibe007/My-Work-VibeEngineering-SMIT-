'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Admin() {
  const [st, setSt] = useState(null), [plans, setPlans] = useState([]), [err, setErr] = useState(''), [msg, setMsg] = useState('');
  const load = async () => {
    const sb = supabase();
    if (!sb) { setErr('Supabase is not configured.'); return; }
    const { data, error } = await sb.rpc('admin_stats');
    if (error) { setErr('Admins only. Log in with an admin account.'); return; }
    setSt(data);
    setPlans((await sb.from('plans').select('*').order('price_usd')).data || []);
  };
  useEffect(() => { load(); }, []);
  const save = async p => {
    const { error } = await supabase().from('plans').update({ monthly_docs: Number(p.monthly_docs) }).eq('id', p.id);
    setMsg(error ? error.message : p.name + ' limit saved.');
  };
  if (err) return <div className="card empty"><p>{err}</p></div>;
  if (!st) return <p>Loading…</p>;
  const K = ({ l, v }) => <div className="card"><div style={{ color: 'var(--mu)', fontSize: 14 }}>{l}</div><div className="serif" style={{ fontSize: 34, fontWeight: 700 }}>{v}</div></div>;
  const rows = o => Object.entries(o).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <h1 style={{ margin: '0 0 4px' }}>Admin dashboard</h1>
      <p style={{ color: 'var(--mu)', margin: '0 0 16px' }}>Aggregated numbers only. Private document contents are never shown here.</p>
      <div className="grid3">
        <K l="Users" v={st.users} /><K l="Documents" v={st.documents} /><K l="Created in last 30 days" v={st.docs_30d} />
        <K l="Completed" v={st.completed} /><K l="Active share links" v={st.shares} /><K l="Signatures" v={st.signatures} />
        <K l="Revenue (invoices paid)" v={(st.revenue_cents / 100).toFixed(2)} />
      </div>
      <div className="ed" style={{ marginTop: 20 }}>
        <div className="card"><h3 style={{ margin: '0 0 8px' }}>Users per plan</h3>{rows(st.plans).map(([k, v]) => <div key={k}>{k}: <strong>{v}</strong></div>)}
          <h3 style={{ margin: '16px 0 8px' }}>Popular templates</h3>{rows(st.templates).map(([k, v]) => <div key={k}>{k}: <strong>{v}</strong></div>)}</div>
        <div className="card"><h3 style={{ margin: '0 0 8px' }}>Plan limits (documents per month)</h3>
          {plans.map(p => <div className="row" key={p.id} style={{ alignItems: 'center' }}><span style={{ width: 80 }}>{p.name}</span>
            <input type="number" min="0" style={{ width: 110 }} aria-label={p.name + ' limit'} value={p.monthly_docs} onChange={e => setPlans(plans.map(x => x.id === p.id ? { ...x, monthly_docs: e.target.value } : x))} />
            <button className="btn s" onClick={() => save(p)}>Save</button></div>)}
          <div className="msg" role="status">{msg}</div></div>
      </div>
    </>
  );
}
