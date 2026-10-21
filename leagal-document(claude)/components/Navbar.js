'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Navbar() {
  const p = usePathname(), r = useRouter(), [u, setU] = useState(null), [admin, setAdmin] = useState(false), [dark, setDark] = useState(false);
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setDark(t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
    const sb = supabase(); if (!sb) return;
    const set = s => setU(s ? s.user : null);
    sb.auth.getSession().then(({ data }) => set(data.session));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, s) => set(s));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    setAdmin(false);
    if (u) supabase().from('profiles').select('role').eq('id', u.id).maybeSingle().then(({ data }) => setAdmin(!!data && data.role === 'admin'));
  }, [u]);
  const toggle = () => {
    const n = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = n;
    try { localStorage.setItem('pl_theme', n); } catch {}
    setDark(!dark);
  };
  const on = h => (p.startsWith(h) ? 'on' : '');
  return (
    <header className="site"><div className="wrap">
      <Link className="brand" href="/">⚖️ Pre<span>Legal</span></Link>
      <nav aria-label="Main">
        <Link className={on('/templates')} href="/templates">Templates</Link>
        <Link className={on('/my-documents')} href="/my-documents">My Documents</Link>
        <Link className={on('/pricing')} href="/pricing">Pricing</Link>
        <Link className={on('/help')} href="/help">Help</Link>
        {u && <Link className={on('/billing')} href="/billing">Billing</Link>}
        {u && <Link className={on('/security')} href="/security">Security</Link>}
        {admin && <Link className={on('/admin')} href="/admin">Admin</Link>}
        {u
          ? <a href="#" onClick={async e => { e.preventDefault(); await supabase().auth.signOut(); r.push('/'); }}>Logout</a>
          : <Link className={on('/login')} href="/login">Login</Link>}
        <button className="chip" style={{ marginLeft: 14 }} onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀️ Light' : '🌙 Dark'}</button>
      </nav>
    </div></header>
  );
}
