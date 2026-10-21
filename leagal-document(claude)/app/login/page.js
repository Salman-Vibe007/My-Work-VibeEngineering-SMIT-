'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function Login() {
  const r = useRouter();
  const [mode, setMode] = useState('login'), [email, setEmail] = useState(''), [pw, setPw] = useState('');
  const [msg, setMsg] = useState({ m: '', k: '' }), [busy, setBusy] = useState(false);
  const [factor, setFactor] = useState(null), [code, setCode] = useState(''), [sent, setSent] = useState(false);
  const say = (m, k = '') => setMsg({ m, k });
  const noSb = () => say('Supabase is not set up. Add the values from .env.example to .env.local.', 'bad');

  const submit = async e => {
    e.preventDefault();
    const sb = supabase(); if (!sb) return noSb();
    setBusy(true); say('');
    const res = mode === 'login'
      ? await sb.auth.signInWithPassword({ email, password: pw })
      : await sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: location.origin + '/my-documents' } });
    setBusy(false);
    if (res.error) return say(res.error.message, 'bad');
    if (mode === 'register' && !res.data.session) { setSent(true); return say('Account created. We sent a verification email. Open it to confirm your address, then log in.', 'ok'); }
    const { data: a } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (a && a.nextLevel === 'aal2' && a.currentLevel !== 'aal2') {
      const { data: f } = await sb.auth.mfa.listFactors();
      setFactor(f.totp[0].id); return say('Enter the 6-digit code from your authenticator app.');
    }
    r.push('/my-documents');
  };
  const verify = async e => {
    e.preventDefault();
    const { error } = await supabase().auth.mfa.challengeAndVerify({ factorId: factor, code });
    if (error) return say(error.message, 'bad');
    r.push('/my-documents');
  };
  const oauth = async provider => {
    const sb = supabase(); if (!sb) return noSb();
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + '/my-documents' } });
    if (error) say(error.message, 'bad');
  };
  const resend = async () => {
    const { error } = await supabase().auth.resend({ type: 'signup', email });
    say(error ? error.message : 'Verification email sent again.', error ? 'bad' : 'ok');
  };

  if (factor) return (
    <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 12px', fontSize: 30 }}>Two-factor check</h1>
      <form onSubmit={verify}>
        <div className="fld"><label htmlFor="cd">6-digit code</label><input id="cd" inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} /></div>
        <button className="btn p">Verify</button>
        <div className={'msg ' + msg.k} role="status">{msg.m}</div>
      </form>
    </div>
  );
  return (
    <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 12px', fontSize: 30 }}>{mode === 'login' ? 'Log in' : 'Create account'}</h1>
      <div className="row" style={{ marginTop: 0 }}>
        <button className="btn" onClick={() => oauth('google')}>Continue with Google</button>
        <button className="btn" onClick={() => oauth('azure')}>Continue with Microsoft</button>
      </div>
      <p style={{ color: 'var(--mu)', fontSize: 13, textAlign: 'center' }}>or use your email</p>
      <form onSubmit={submit}>
        <div className="fld"><label htmlFor="em">Email</label><input id="em" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="fld"><label htmlFor="pw">Password</label><input id="pw" type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={pw} onChange={e => setPw(e.target.value)} /></div>
        <button className="btn p" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}</button>
        {sent && <button type="button" className="btn" style={{ marginLeft: 8 }} onClick={resend}>Resend email</button>}
        <div className={'msg ' + msg.k} role="status">{msg.m}</div>
      </form>
      <p style={{ color: 'var(--mu)', fontSize: 14 }}>
        {mode === 'login' ? 'New here? ' : 'Already have an account? '}
        <a href="#" onClick={e => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); say(''); setSent(false); }}>{mode === 'login' ? 'Create an account' : 'Log in'}</a>
      </p>
    </div>
  );
}
