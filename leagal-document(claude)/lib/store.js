// Saves to Supabase when logged in, otherwise to this browser (localStorage).
import { supabase } from '@/lib/supabase/client';
const K = 'pl_docs';
const ls = {
  get() { try { return JSON.parse(localStorage.getItem(K) || '[]'); } catch { return []; } },
  set(v) { try { localStorage.setItem(K, JSON.stringify(v)); } catch {} },
};
async function user() {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session ? data.session.user : null;
}
const fromRow = r => ({ id: r.id, tid: r.template_id, title: r.title, data: r.data || {}, status: r.status, u: new Date(r.updated_at).getTime() });

export async function isCloud() { return !!(await user()); }
export async function listDocs() {
  if (await user()) {
    const { data, error } = await supabase().from('documents').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return data.map(fromRow);
  }
  return ls.get();
}
export async function getDoc(id) {
  if (await user()) {
    const { data, error } = await supabase().from('documents').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? fromRow(data) : null;
  }
  return ls.get().find(d => d.id === id) || null;
}
export async function saveDoc(d) {
  if (await user()) {
    const { error } = await supabase().from('documents').upsert({
      id: d.id, template_id: d.tid, title: d.title, data: d.data, status: d.status, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return;
  }
  const l = ls.get(), i = l.findIndex(x => x.id === d.id), n = { ...d, u: Date.now() };
  if (i < 0) l.unshift(n); else l[i] = n;
  ls.set(l);
}
export async function removeDoc(id) {
  if (await user()) {
    const { error } = await supabase().from('documents').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  ls.set(ls.get().filter(x => x.id !== id));
}

// ----- sharing & signatures (logged-in users only) -----
export async function listShares() {
  const { data } = await supabase().from('document_shares').select('*').eq('revoked', false).gt('expires_at', new Date().toISOString());
  return data || [];
}
export async function listSignatures() {
  const { data } = await supabase().from('signatures').select('*').order('signed_at');
  return data || [];
}
export async function createShare(docId) {
  const a = new Uint8Array(16); crypto.getRandomValues(a);
  const token = [...a].map(b => b.toString(16).padStart(2, '0')).join('');
  const { data, error } = await supabase().from('document_shares')
    .insert({ document_id: docId, token, expires_at: new Date(Date.now() + 7 * 864e5).toISOString() }).select().single();
  if (error) throw error;
  return data;
}
export async function revokeShare(id) {
  const { error } = await supabase().from('document_shares').update({ revoked: true }).eq('id', id);
  if (error) throw error;
}
