"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

interface Props {
  user: { fullName: string | null };
}

export default function AdminTopBar({ user }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const { signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  return (
    <header className="h-16 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-white text-lg font-semibold">Chronos Admin Dashboard</h1>
      </div>
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
        >
          <div className="w-8 h-8 bg-[#4682B4] rounded-full flex items-center justify-center text-white text-sm font-bold">
            {(user.fullName || "A")[0].toUpperCase()}
          </div>
          <span className="text-sm hidden sm:block">{user.fullName || "Admin"}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl z-50 py-1">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm text-white font-medium">{user.fullName || "Admin"}</p>
                <p className="text-xs text-slate-400 mt-0.5">Administrator</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
