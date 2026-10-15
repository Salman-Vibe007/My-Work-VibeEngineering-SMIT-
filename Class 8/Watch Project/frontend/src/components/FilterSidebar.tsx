"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const brands = ["Rolex", "Omega", "TAG Heuer", "Citizen", "Seiko", "Tissot"];
const styles = ["sport", "dress", "casual"];
const movements = ["automatic", "quartz", "manual"];
const priceRanges = [
  { label: "Under $500", min: 0, max: 500 },
  { label: "$500 - $1,000", min: 500, max: 1000 },
  { label: "$1,000 - $5,000", min: 1000, max: 5000 },
  { label: "$5,000+", min: 5000, max: 999999 },
];

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "");
  const [selectedStyle, setSelectedStyle] = useState(searchParams.get("style") || "");
  const [selectedMovement, setSelectedMovement] = useState(searchParams.get("movement_type") || "");
  const [selectedPrice, setSelectedPrice] = useState(searchParams.get("price") || "");

  const applyFilters = () => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (selectedStyle) params.set("style", selectedStyle);
    if (selectedMovement) params.set("movement_type", selectedMovement);
    if (selectedPrice) params.set("price", selectedPrice);
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedBrand("");
    setSelectedStyle("");
    setSelectedMovement("");
    setSelectedPrice("");
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#121212] mb-3">Brand</h3>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="brand" checked={selectedBrand === brand}
                onChange={() => setSelectedBrand(brand === selectedBrand ? "" : brand)}
                className="w-4 h-4 text-[#4682B4] accent-[#4682B4]" />
              <span className="text-sm text-gray-600 group-hover:text-[#121212] transition-colors">{brand}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#121212] mb-3">Style</h3>
        <div className="space-y-2">
          {styles.map((style) => (
            <label key={style} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="style" checked={selectedStyle === style}
                onChange={() => setSelectedStyle(style === selectedStyle ? "" : style)}
                className="w-4 h-4 text-[#4682B4] accent-[#4682B4]" />
              <span className="text-sm text-gray-600 capitalize group-hover:text-[#121212] transition-colors">{style}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#121212] mb-3">Movement</h3>
        <div className="space-y-2">
          {movements.map((mov) => (
            <label key={mov} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="movement" checked={selectedMovement === mov}
                onChange={() => setSelectedMovement(mov === selectedMovement ? "" : mov)}
                className="w-4 h-4 text-[#4682B4] accent-[#4682B4]" />
              <span className="text-sm text-gray-600 capitalize group-hover:text-[#121212] transition-colors">{mov}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#121212] mb-3">Price Range</h3>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label key={range.label} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="price" checked={selectedPrice === `${range.min}-${range.max}`}
                onChange={() => setSelectedPrice(selectedPrice === `${range.min}-${range.max}` ? "" : `${range.min}-${range.max}`)}
                className="w-4 h-4 text-[#4682B4] accent-[#4682B4]" />
              <span className="text-sm text-gray-600 group-hover:text-[#121212] transition-colors">{range.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={applyFilters} className="flex-1 py-2 bg-[#4682B4] text-white text-sm font-medium rounded-lg hover:bg-[#3A6E9A] transition-colors">Apply</button>
        <button onClick={clearFilters} className="flex-1 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Clear</button>
      </div>
    </div>
  );
}
