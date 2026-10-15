import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import type { Product } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: featured } = await supabase
    .from("products").select("*").eq("featured", true)
    .order("created_at", { ascending: false }).limit(4);

  const { data: newArrivals } = await supabase
    .from("products").select("*")
    .order("created_at", { ascending: false }).limit(8);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-[#121212] text-[#FFFDD0] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#121212] via-[#1e1e1e] to-[#121212] opacity-90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl animate-slide-up">
            <p className="text-[#2E8B57] font-medium text-sm uppercase tracking-[0.2em] mb-4">Premium Timepieces</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Time is <span className="text-[#4682B4]">Precision</span>,<br />Worn with <span className="text-[#A0522D]">Elegance</span>
            </h1>
            <p className="text-lg text-[#FFFDD0]/70 mb-8 max-w-lg">
              Discover our curated collection of world-class watches. From mechanical marvels to modern smartwatches.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="px-8 py-3 bg-[#4682B4] text-white font-medium rounded-lg hover:bg-[#3A6E9A] transition-colors">
                Shop Collection
              </Link>
              <Link href="/products?featured=true" className="px-8 py-3 border border-[#FFFDD0]/30 text-[#FFFDD0] font-medium rounded-lg hover:bg-[#FFFDD0]/10 transition-colors">
                Featured
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-[#FFFDD0] border-b border-[#8B4513]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: "M5 12h14M12 5l7 7-7 7", label: "Free Shipping over $500", color: "#4682B4" },
              { icon: "M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z", label: "Secure Checkout", color: "#2E8B57" },
              { icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", label: "Authentic Products", color: "#8B4513" },
              { icon: "M9 2a1 1 0 000 2h2a1 1 0 100-2H9z", label: "2-Year Warranty", color: "#4682B4" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <svg className="w-6 h-6" style={{ color: item.color }} fill={item.color === "#2E8B57" || item.color === "#4682B4" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
                  <path d={item.icon} />
                </svg>
                <span className="text-xs font-medium text-[#121212]/70">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchBar />
      </section>

      {/* Featured */}
      {featured && featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#121212]">Featured Watches</h2>
              <p className="text-sm text-gray-500 mt-1">Handpicked by our experts</p>
            </div>
            <Link href="/products?featured=true" className="text-sm font-medium text-[#4682B4] hover:text-[#3A6E9A] transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((p: Product) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Brands */}
      <section className="bg-[#FFFDD0]/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-400 uppercase tracking-[0.3em] mb-8">Trusted Brands</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
            {["Rolex", "Omega", "TAG Heuer", "Citizen", "Seiko", "Tissot"].map((brand) => (
              <span key={brand} className="text-lg font-bold text-[#121212]/40">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals && newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#121212]">New Arrivals</h2>
              <p className="text-sm text-gray-500 mt-1">Latest additions to our collection</p>
            </div>
            <Link href="/products" className="text-sm font-medium text-[#4682B4] hover:text-[#3A6E9A] transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((p: Product) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[#121212] text-[#FFFDD0] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Timepiece</h2>
          <p className="text-[#FFFDD0]/60 mb-8 max-w-lg mx-auto">Browse our complete collection and discover the watch that speaks to your style.</p>
          <Link href="/products" className="inline-block px-8 py-3 bg-[#4682B4] text-white font-medium rounded-lg hover:bg-[#3A6E9A] transition-colors">
            Explore All Watches
          </Link>
        </div>
      </section>
    </div>
  );
}
