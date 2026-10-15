"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Unable to sign in. Please try again.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", data.user.id)
      .single();

    if (!profile?.is_admin) {
      setError("Access denied. This account is not an administrator.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg className="w-10 h-10 text-[#4682B4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-2xl font-bold text-white tracking-wider">CHRONOS</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to manage your store</p>
        </div>

        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50 focus:border-[#4682B4] transition-colors"
                placeholder="admin@chronos.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50 focus:border-[#4682B4] transition-colors"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#4682B4] text-white font-medium rounded-lg hover:bg-[#3A6E9A] transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          <Link href="/" className="text-[#4682B4] hover:text-[#5a9fd4] transition-colors">Back to Store</Link>
        </p>
      </div>
    </div>
  );
}
