"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/products?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search watches by brand, model, or style..."
        className="w-full py-3 px-4 pr-12 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50 focus:border-[#4682B4] transition-all"
      />
      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4682B4] hover:text-[#3A6E9A] transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </form>
  );
}
