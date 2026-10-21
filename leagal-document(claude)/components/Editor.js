'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { T } from '@/lib/templates';
import { val, missing, paper, toText } from '@/lib/render';
import { getDoc, saveDoc } from '@/lib/store';

export default function Editor({ tid }) {
  const t = T.find(x => x.id === tid);
  const [doc, setDoc] = useState(null), [errs, setErrs] = useState({}), [msg, setMsg] = useState({ m: '', k: '' });
  const [ck, setCk] = useState(false), [sv, setSv] = useState('Not saved yet'), [arm, setArm] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!t) return;
    const d = new URLSearchParams(location.search).get('d');
    let off = false;
    (async () => {
      let f = null;
      try { f = d && (await getDoc(d)); } catch {}
      if (off) return;
      setDoc(f || { id: crypto.randomUUID(), tid, title: t.title, data: {}, status: 'draft' });
      if (f) setSv('Editing saved draft');
    })();
    return () => { off = true; };
  }, [tid]);

  if (!t) return <p>Template not found. <Link href="/templates">Back to templates</Link></p>;
  if (!doc) return <p>Loading…</p>;

  const say = (m, k = '') => setMsg({ m, k });
  const persist = async d => {
    if (!t.f.some(f => val(d.data, f.n))) return;
    const lead = t.f.find(f => f.t === 'text'), v = lead && val(d.data, lead.n);
    try {
      await saveDoc({ ...d, title: t.title + (v ? ' – ' + v : '') });
      setSv('✓ Draft saved ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) { setSv('Could not save: ' + (e.message || 'error')); }
  };
  const change = (n, v) => {
    const d = { ...doc, data: { ...doc.data, [n]: v } };
    setDoc(d); setErrs(e => ({ ...e, [n]: '' }));
    clearTimeout(timer.current); timer.current = setTimeout(() => persist(d), 600);
  };
  const setAll = data => { const d = { ...doc, data }; setDoc(d); setErrs({}); persist(d); };
  const check = () => {
    const e = {}; missing(t, doc.data).forEach(f => { e[f.n] = 'This field is required.'; });
    setErrs(e); const n = Object.keys(e).length;
    if (n) { say(n + (n > 1 ? ' required fields need' : ' required field needs') + ' your attention.', 'bad'); return false; }
    if (!ck) { say('Please tick the review checklist first.', 'bad'); return false; }
    say(''); return true;
  };
  const example = () => { const x = {}; t.f.forEach((f, i) => { x[f.n] = t.ex[i] || ''; }); setAll(x); say('Example data filled in.', 'ok'); };
  const reset = () => {
    if (!arm) { setArm(true); setTimeout(() => setArm(false), 3000); return; }
    setArm(false); setCk(false); setAll({}); say('Form cleared.');
  };
  const print = () => { if (check()) { persist(doc); window.print(); } };
  const copy = async () => {
    if (!check()) return;
    try { await navigator.clipboard.writeText(toText(t, doc.data)); say('Copied to clipboard.', 'ok'); }
    catch { say('Copy was blocked. Select the preview text and copy it manually.', 'bad'); }
  };
  const download = () => {
    if (!check()) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([toText(t, doc.data)], { type: 'text/plain' }));
    a.download = t.id + '.txt'; a.click(); URL.revokeObjectURL(a.href);
  };
  const complete = async () => {
    if (!check()) return;
    const n = { ...doc, status: 'completed' }; setDoc(n); await persist(n);
    say('Marked as completed. Find it under My Documents.', 'ok');
  };
  const miss = missing(t, doc.data).length;

  return (
    <>
      <p className="noprint"><Link href="/templates">← All templates</Link></p>
      <div className="ed">
        <section className="card noprint" aria-label="Form">
          <h1 style={{ margin: '0 0 4px', fontSize: 28 }}>{t.title}</h1>
          <p style={{ color: 'var(--mu)', margin: '0 0 16px' }}>{t.desc} Fields marked <span style={{ color: 'var(--or)' }}>*</span> are required.</p>
          {t.f.map(f => (
            <div className="fld" key={f.n}>
              <label htmlFor={'f_' + f.n}>{f.l}{f.r && <span className="req"> *</span>}</label>
              {f.t === 'textarea'
                ? <textarea id={'f_' + f.n} rows={3} value={doc.data[f.n] || ''} aria-invalid={!!errs[f.n]} onChange={e => change(f.n, e.target.value)} />
                : <input id={'f_' + f.n} type={f.t} min={f.t === 'number' ? 0 : undefined} value={doc.data[f.n] || ''} aria-invalid={!!errs[f.n]} onChange={e => change(f.n, e.target.value)} />}
              <div className="err">{errs[f.n]}</div>
            </div>
          ))}
          <div className="row">
            <button className="btn s" onClick={example}>Fill with example</button>
            <button className="btn s d" onClick={reset}>{arm ? 'Click again to confirm' : 'Reset form'}</button>
          </div>
          <label className="ck"><input type="checkbox" checked={ck} onChange={e => setCk(e.target.checked)} /><span>I have checked all names, dates, and amounts, and I understand this is a draft and not legal advice.</span></label>
          <div className="row">
            <button className="btn p" onClick={print}>Print / Save as PDF</button>
            <button className="btn" onClick={copy}>Copy text</button>
            <button className="btn" onClick={download}>Download .txt</button>
            <button className="btn" onClick={complete}>Mark complete</button>
          </div>
          <div className={'msg ' + msg.k} role="status">{msg.m}</div>
        </section>
        <section className="sticky" aria-label="Preview">
          <div className="stat">
            <span>{miss ? <span className="pill">{miss} required field{miss > 1 ? 's' : ''} missing</span> : <span className="pill ok">✓ All required fields filled</span>}</span>
            <span className="noprint">{sv}</span>
          </div>
          <article className="paper" dangerouslySetInnerHTML={{ __html: paper(t, doc.data) }} />
        </section>
      </div>
    </>
  );
}
