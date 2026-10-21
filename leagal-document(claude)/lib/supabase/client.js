import { createBrowserClient } from '@supabase/ssr';
let c;
export function supabase() {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL, k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!u || !k) return null;
  return (c = c || createBrowserClient(u, k));
}
