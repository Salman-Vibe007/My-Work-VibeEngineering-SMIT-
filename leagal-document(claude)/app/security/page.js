'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Security() {
  const [fs, setFs] = useState([]), [en, setEn] = useState(null), [code, setCode] = useState(''), [msg, setMsg] = useState({ m: '', k: '' });
  const load = async () => { const { data } = await supabase().auth.mfa.listFactors(); setFs((data && data.totp) || []); };
  useEffect(() => { if (supabase()) load(); }, []);
  const bad = e => setMsg({ m: e.message, k: 'bad' });
  const start = async () => {
    const { data, error } = await supabase().auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator ' + Date.now() });
    if (error) return bad(error); setEn(data); setMsg({ m: '', k: '' });
  };
  const verify = async () => {
    const sb = supabase(), c = await sb.auth.mfa.challenge({ factorId: en.id });
    if (c.error) return bad(c.error);
    const v = await sb.auth.mfa.verify({ factorId: en.id, challengeId: c.data.id, code });
    if (v.error) return bad(v.error);
    setEn(null); setCode(''); setMsg({ m: 'Two-factor authentication is now on.', k: 'ok' }); load();
  };
  const remove = async id => { const { error } = await supabase().auth.mfa.unenroll({ factorId: id }); if (error) return bad(error); setMsg({ m: 'Two-factor authentication removed.', k: 'ok' }); load(); };
  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 30 }}>Account security</h1>
      <p style={{ color: 'var(--mu)' }}>Two-factor authentication asks for a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, Authy) when you log in.</p>
      {fs.length > 0 && !en && <><p><span className="pill ok">✓ Two-factor authentication is on</span></p><button className="btn d" onClick={() => remove(fs[0].id)}>Turn off</button></>}
      {!fs.length && !en && <button className="btn p" onClick={start}>Set up two-factor authentication</button>}
      {en && <>
        <p>1. Scan this QR code with your authenticator app.</p>
        <img src={en.totp.qr_code} alt="QR code for your authenticator app" width="180" height="180" style={{ background: '#fff', padding: 8, borderRadius: 8 }} />
        <p style={{ fontSize: 13, color: 'var(--mu)' }}>Can't scan? Enter this key: <code>{en.totp.secret}</code></p>
        <div className="fld"><label htmlFor="c">2. Enter the 6-digit code</label><input id="c" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value)} /></div>
        <button className="btn p" onClick={verify}>Verify and turn on</button>
      </>}
      <div className={'msg ' + msg.k} role="status">{msg.m}</div>
    </div>
  );
}
