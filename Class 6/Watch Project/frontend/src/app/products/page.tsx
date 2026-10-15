import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import type { Product } from "@/types/database";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("products").select("*");

  const q = typeof params.q === "string" ? params.q : null;
  if (q) query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%,description.ilike.%${q}%`);

  const brand = typeof params.brand === "string" ? params.brand : null;
  if (brand) query = query.eq("brand", brand);

  const style = typeof params.style === "string" ? params.style : null;
  if (style) query = query.eq("style", style);

  const movementType = typeof params.movement_type === "string" ? params.movement_type : null;
  if (movementType) query = query.eq("movement_type", movementType);

  const priceRange = typeof params.price === "string" ? params.price : null;
  if (priceRange) {
    const [min, max] = priceRange.split("-").map(Number);
    if (!isNaN(min)) query = query.gte("price", min);
    if (!isNaN(max)) query = query.lte("price", max);
  }

  const featured = typeof params.featured === "string" ? params.featured : null;
  if (featured === "true") query = query.eq("featured", true);

  query = query.order("created_at", { ascending: false });
  const { data: products } = await query;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#121212]">{q ? `Search results for "${q}"` : "All Watches"}</h1>
        <p className="text-sm text-gray-500 mt-1">{products?.length || 0} watches found</p>
      </div>
      <div className="mb-8"><SearchBar defaultValue={q || ""} /></div>
      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24"><FilterSidebar /></div>
        </aside>
        <div className="flex-1">
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product: Product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-gray-500 text-lg">No watches found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
