"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore, type CartStoreItem } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

export default function CartItemRow({ item }: { item: CartStoreItem }) {
  const { updateQuantity, removeItem } = useCartStore();
  const { product, quantity } = item;

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 animate-fade-in">
      <Link href={`/products/${product.id}`} className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#FFFDD0]/30 flex-shrink-0">
        {product.images[0] ? (
          <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8B4513]/30">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-[#8B4513] font-medium uppercase">{product.brand}</p>
            <Link href={`/products/${product.id}`} className="text-sm font-semibold text-[#121212] hover:text-[#4682B4] transition-colors">{product.name}</Link>
          </div>
          <button onClick={() => removeItem(product.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button onClick={() => updateQuantity(product.id, quantity - 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#121212] transition-colors">-</button>
            <span className="w-10 text-center text-sm font-medium">{quantity}</span>
            <button onClick={() => updateQuantity(product.id, quantity + 1)} disabled={quantity >= product.stock}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#121212] transition-colors disabled:text-gray-300">+</button>
          </div>
          <span className="text-sm font-bold text-[#121212]">{formatPrice(product.price * quantity)}</span>
        </div>
      </div>
    </div>
  );
}