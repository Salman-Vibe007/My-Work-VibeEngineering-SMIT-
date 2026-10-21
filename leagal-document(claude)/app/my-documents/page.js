'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listDocs, saveDoc, removeDoc, isCloud, listShares, listSignatures, createShare, revokeShare } from '@/lib/store';

export default function MyDocuments() {
  const [l, setL] = useState(null), [arm, setArm] = useState(''), [err, setErr] = useState(''), [cloud, setCloud] = useState(false);
  const [sh, setSh] = useState({}), [sg, setSg] = useState({}), [cp, setCp] = useState('');
  const load = async () => {
    try {
      const c = await isCloud(); setCloud(c); setL(await listDocs());
      if (c) {
        const s = {}, g = {};
        (await listShares()).forEach(x => { s[x.document_id] = x; });
        (await listSignatures()).forEach(x => { (g[x.document_id] = g[x.document_id] || []).push(x); });
        setSh(s); setSg(g);
      }
    } catch (e) { setErr(e.message || 'Could not load documents.'); setL([]); }
  };
  useEffect(() => { load(); }, []);
  const run = async fn => { setErr(''); try { await fn(); await load(); } catch (e) { setErr(e.message || 'Something went wrong.'); } };
  const del = id => { if (arm !== id) { setArm(id); setTimeout(() => setArm(''), 3000); return; } setArm(''); run(() => removeDoc(id)); };
  const link = s => location.origin + '/share/' + s.token;
  const copy = async s => { try { await navigator.clipboard.writeText(link(s)); setCp(s.id); } catch { setErr('Copy blocked. Select the link and copy it manually.'); } };
  return (
    <>
      <h1 style={{ margin: '0 0 4px' }}>My documents</h1>
      <p style={{ color: 'var(--mu)', margin: '0 0 16px' }}>
        {cloud ? 'Saved in your account. You can share documents for signing.' : <>Saved only in this browser. <Link href="/login">Log in</Link> to keep them in your account and share them.</>}
      </p>
      {err && <div className="msg bad">{err}</div>}
      {l === null ? <p>Loading…</p> : l.length ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {l.map(d => (
            <div className="card dl" key={d.id}>
              <div><h3>{d.title}</h3><small>{d.status === 'completed' ? '✓ Completed' : 'Draft'} · updated {new Date(d.u).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</small></div>
              <div className="row" style={{ margin: 0 }}>
                <Link className="btn s p" href={`/templates/${d.tid}?d=${d.id}`}>Open</Link>
                {cloud && !sh[d.id] && <button className="btn s" onClick={() => run(() => createShare(d.id))}>Share</button>}
                <button className="btn s" onClick={() => run(() => saveDoc({ ...d, id: crypto.randomUUID(), title: d.title + ' (copy)', status: 'draft' }))}>Duplicate</button>
                <button className="btn s d" onClick={() => del(d.id)}>{arm === d.id ? 'Click again to confirm' : 'Delete'}</button>
              </div>
              {sh[d.id] && (
                <div style={{ width: '100%' }}>
                  <small>Share link (expires {new Date(sh[d.id].expires_at).toLocaleDateString('en-GB')}):</small>
                  <input readOnly value={link(sh[d.id])} onFocus={e => e.target.select()} aria-label="Share link" />
                  <div className="row"><button className="btn s" onClick={() => copy(sh[d.id])}>{cp === sh[d.id].id ? 'Copied ✓' : 'Copy link'}</button><button className="btn s d" onClick={() => run(() => revokeShare(sh[d.id].id))}>Revoke link</button></div>
                </div>
              )}
              {(sg[d.id] || []).length > 0 && <div style={{ width: '100%', fontSize: 14 }}>{sg[d.id].map(s => <div key={s.id}>✍ Signed by <strong>{s.signer_name}</strong> · {new Date(s.signed_at).toLocaleString('en-GB')}</div>)}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty"><h3 style={{ margin: '0 0 6px' }}>No documents yet</h3><p>Create your first one from the template library.</p><Link className="btn p" href="/templates">Browse templates</Link></div>
      )}
    </>
  );
}
