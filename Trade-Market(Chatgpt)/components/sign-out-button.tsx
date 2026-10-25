"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function signOut() {
    setBusy(true);
    try { const supabase = createClient(); await supabase.auth.signOut(); }
    finally { router.replace("/login"); router.refresh(); setBusy(false); }
  }
  return <button className={`signout-button ${compact ? "signout-compact" : ""}`} onClick={signOut} disabled={busy} type="button">{busy ? <Loader2 size={16} className="spin"/> : <LogOut size={16}/>}<span>{compact ? "Sign out" : "Sign out"}</span></button>;
}
