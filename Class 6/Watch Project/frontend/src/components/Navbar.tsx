"use client";

import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const { user, signOut } = useAuthStore();

  return (
    <nav className="bg-[#121212] text-[#FFFDD0] sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <svg className="w-8 h-8 text-[#4682B4] group-hover:text-[#2E8B57] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xl font-bold tracking-wider">CHRONOS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-sm font-medium hover:text-[#2E8B57] transition-colors">Shop</Link>
            <Link href="/products?style=sport" className="text-sm font-medium hover:text-[#2E8B57] transition-colors">Sport</Link>
            <Link href="/products?style=dress" className="text-sm font-medium hover:text-[#2E8B57] transition-colors">Dress</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative p-2 hover:text-[#2E8B57] transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#2E8B57] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-xs text-[#FFFDD0]/70">{user.email}</span>
                <button onClick={() => signOut()} className="text-sm font-medium px-3 py-1 border border-[#FFFDD0]/30 rounded hover:bg-[#FFFDD0]/10 transition-colors">
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="hidden md:inline-block text-sm font-medium px-4 py-2 bg-[#4682B4] text-white rounded hover:bg-[#3A6E9A] transition-colors">
                Sign In
              </Link>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-[#FFFDD0]/10 mt-2 pt-4 animate-fade-in">
            <div className="flex flex-col gap-3">
              <Link href="/products" onClick={() => setMobileOpen(false)} className="text-sm font-medium hover:text-[#2E8B57]">Shop All</Link>
              <Link href="/products?style=sport" onClick={() => setMobileOpen(false)} className="text-sm font-medium hover:text-[#2E8B57]">Sport</Link>
              <Link href="/products?style=dress" onClick={() => setMobileOpen(false)} className="text-sm font-medium hover:text-[#2E8B57]">Dress</Link>
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="text-sm font-medium hover:text-[#2E8B57]">Profile</Link>
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="text-sm font-medium text-left text-[#A0522D]">Sign Out</button>
                </>
              ) : (
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#4682B4]">Sign In</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
