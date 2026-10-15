"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/database";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const discount = getDiscountPercent(product.price, product.original_price);

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-in">
      <Link href={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-[#FFFDD0]/30">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8B4513]/40">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discount && (
            <span className="bg-[#2E8B57] text-white text-xs font-bold px-2 py-1 rounded">-{discount}%</span>
          )}
          {product.featured && (
            <span className="bg-[#4682B4] text-white text-xs font-bold px-2 py-1 rounded">Featured</span>
          )}
        </div>
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}
      </Link>
      <div className="p-4">
        <p className="text-xs text-[#8B4513] font-medium uppercase tracking-wider mb-1">{product.brand}</p>
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-semibold text-[#121212] hover:text-[#4682B4] transition-colors line-clamp-1">{product.name}</h3>
        </Link>
        <p className="text-xs text-gray-500 mt-1 capitalize">{product.movement_type} &middot; {product.case_material}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-[#121212]">{formatPrice(product.price)}</span>
          {product.original_price && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.original_price)}</span>
          )}
        </div>
        <button
          onClick={() => product.stock > 0 && addItem(product)}
          disabled={product.stock <= 0}
          className="mt-3 w-full py-2 text-sm font-medium rounded-lg transition-colors bg-[#4682B4] text-white hover:bg-[#3A6E9A] disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}
