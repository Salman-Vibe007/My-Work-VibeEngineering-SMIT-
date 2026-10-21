'use client';
import Link from 'next/link';
import { useState } from 'react';
import { T, CATS } from '@/lib/templates';

export default function Library() {
  const [q, setQ] = useState(''), [cat, setCat] = useState('All');
  const r = T.filter(t => (cat === 'All' || t.cat === cat) && (t.title + t.desc).toLowerCase().includes(q.toLowerCase().trim()));
  return (
    <>
      <h1 style={{ margin: 0 }}>Template library</h1>
      <p style={{ color: 'var(--mu)', margin: '4px 0 0' }}>Choose the document you need.</p>
      <div className="tools">
        <input type="search" placeholder="Search templates…" aria-label="Search templates" value={q} onChange={e => setQ(e.target.value)} />
        <div role="group" aria-label="Category">
          {CATS.map(c => <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      </div>
      <div className="grid3">
        {r.length ? r.map(t => (
          <article key={t.id} className="card tc">
            <span className="tag">{t.cat}</span><h3>{t.title}</h3><p>{t.desc}</p>
            <Link className="btn p s" href={`/templates/${t.id}`}>Use template</Link>
          </article>
        )) : <div className="empty" style={{ gridColumn: '1/-1' }}>No templates match your search.</div>}
      </div>
    </>
  );
}
