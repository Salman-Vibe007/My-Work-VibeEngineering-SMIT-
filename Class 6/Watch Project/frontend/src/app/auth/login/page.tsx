"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#121212]">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to your Chronos account</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50 focus:border-[#4682B4]"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50 focus:border-[#4682B4]"
              placeholder="Enter your password" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#4682B4] text-white font-medium rounded-lg hover:bg-[#3A6E9A] transition-colors disabled:bg-gray-300">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account? <Link href="/auth/register" className="text-[#4682B4] hover:text-[#3A6E9A] font-medium">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
