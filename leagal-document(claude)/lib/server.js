// SERVER ONLY. Uses the service role key, which must never be exposed to the browser.
import { createClient } from '@supabase/supabase-js';
export const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
export async function userFrom(req) {
  const t = (req.headers.get('authorization') || '').replace('Bearer ', '');
  if (!t) return null;
  const { data } = await admin().auth.getUser(t);
  return data.user || null;
}
export const baseUrl = req => process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
