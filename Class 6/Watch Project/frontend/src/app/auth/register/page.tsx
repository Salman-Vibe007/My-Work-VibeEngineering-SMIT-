"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#121212]">Create Account</h1>
          <p className="text-gray-500 mt-2">Join Chronos for exclusive access</p>
        </div>
        <form onSubmit={handleRegister} className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" placeholder="Min. 6 characters" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#4682B4] text-white font-medium rounded-lg hover:bg-[#3A6E9A] transition-colors disabled:bg-gray-300">
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account? <Link href="/auth/login" className="text-[#4682B4] hover:text-[#3A6E9A] font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
