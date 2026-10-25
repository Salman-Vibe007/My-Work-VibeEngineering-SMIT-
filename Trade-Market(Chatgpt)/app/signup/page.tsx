import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth-form";

export default async function SignupPage() {
  let alreadySignedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    alreadySignedIn = Boolean(data.user);
  } catch { /* Let users reach the form to see setup errors before configuration. */ }
  if (alreadySignedIn) redirect("/dashboard");
  return <main className="auth-shell"><Link href="/" className="brand-lockup auth-brand"><span className="brand-mark">F</span><span>FinAlly<span className="brand-dot">.</span><small>FINANCE, MADE CLEAR.</small></span></Link><div className="auth-card"><div className="auth-symbol">F</div><span className="section-kicker">START PRACTICING</span><h1>Your market space awaits.</h1><p>Create an account to save your watchlist and virtual portfolio.</p><AuthForm mode="signup"/><div className="auth-switch">Already have an account? <Link href="/login">Log in</Link></div></div><p className="auth-foot">You start with $10,000 in virtual cash. No real trades.</p></main>;
}
