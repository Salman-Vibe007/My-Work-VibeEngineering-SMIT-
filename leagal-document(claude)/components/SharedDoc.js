'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { T } from '@/lib/templates';
import { paper } from '@/lib/render';

export default function SharedDoc({ token }) {
  const [doc, setDoc] = useState(undefined), [name, setName] = useState(''), [ok, setOk] = useState(false), [msg, setMsg] = useState({ m: '', k: '' });
  const load = async () => {
    const sb = supabase();
    if (!sb) { setDoc(null); return; }
    const { data } = await sb.rpc('get_shared_document', { p_token: token });
    setDoc(data || null);
  };
  useEffect(() => { load(); }, [token]);
  if (doc === undefined) return <p>Loading…</p>;
  const t = doc && T.find(x => x.id === doc.template_id);
  if (!doc || !t) return <div className="card empty"><h3>Link not available</h3><p>This link is invalid, has expired, or was revoked by its owner.</p></div>;
  const sign = async () => {
    if (name.trim().length < 2 || !ok) { setMsg({ m: 'Type your full name and tick the box.', k: 'bad' }); return; }
    const { data } = await supabase().rpc('sign_shared_document', { p_token: token, p_name: name });
    if (data) { setMsg({ m: 'Thank you. Your signature was recorded.', k: 'ok' }); setName(''); setOk(false); load(); }
    else setMsg({ m: 'Could not sign. The link may have expired.', k: 'bad' });
  };
  return (
    <div className="ed">
      <section className="card noprint" aria-label="Sign">
        <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>Review and sign</h1>
        <p style={{ color: 'var(--mu)' }}>You were sent this draft for review. Read it, then sign below.</p>
        <div className="fld"><label htmlFor="sn">Your full name</label><input id="sn" value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></div>
        <label className="ck"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} /><span>I have read this document and agree to sign it electronically by typing my name.</span></label>
        <div className="row"><button className="btn p" onClick={sign}>Sign document</button><button className="btn" onClick={() => window.print()}>Print / Save as PDF</button></div>
        <div className={'msg ' + msg.k} role="status">{msg.m}</div>
        <p style={{ color: 'var(--mu)', fontSize: 13 }}>This is a simple electronic signature (typed name with date and time). It is not a certified digital signature.</p>
      </section>
      <section className="sticky">
        <article className="paper">
          <div dangerouslySetInnerHTML={{ __html: paper(t, doc.data) }} />
          {doc.signatures.length > 0 && <div style={{ marginTop: 20 }}><h3>Signatures</h3>{doc.signatures.map((s, i) => <p key={i}><span style={{ fontStyle: 'italic', fontSize: 22 }}>{s.name}</span> <small style={{ fontFamily: 'DM Sans,sans-serif' }}>signed {new Date(s.at).toLocaleString('en-GB')}</small></p>)}</div>}
        </article>
      </section>
    </div>
  );
}
