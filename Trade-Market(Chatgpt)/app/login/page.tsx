import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage() {
  let alreadySignedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    alreadySignedIn = Boolean(data.user);
  } catch { /* Let users reach the form to see setup errors before configuration. */ }
  if (alreadySignedIn) redirect("/dashboard");
  return <main className="auth-shell"><Link href="/" className="brand-lockup auth-brand"><span className="brand-mark">F</span><span>FinAlly<span className="brand-dot">.</span><small>FINANCE, MADE CLEAR.</small></span></Link><div className="auth-card"><div className="auth-symbol">F</div><span className="section-kicker">WELCOME BACK</span><h1>Good to see you.</h1><p>Sign in to return to your market workspace.</p><AuthForm mode="login"/><div className="auth-switch">New to FinAlly? <Link href="/signup">Create an account</Link></div></div><p className="auth-foot">Paper trading only · No brokerage connection</p></main>;
}
