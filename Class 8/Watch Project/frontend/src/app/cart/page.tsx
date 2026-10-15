"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";
import CartItemRow from "@/components/CartItemRow";
import CartSummary from "@/components/CartSummary";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <svg className="w-20 h-20 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
        </svg>
        <h1 className="text-2xl font-bold text-[#121212] mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-6">Discover our collection and find your perfect timepiece.</p>
        <Link href="/products" className="inline-block px-8 py-3 bg-[#4682B4] text-white font-medium rounded-lg hover:bg-[#3A6E9A] transition-colors">Browse Watches</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#121212]">Shopping Cart</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 transition-colors">Clear Cart</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {items.map((item) => <CartItemRow key={item.product.id} item={item} />)}
        </div>
        <div><CartSummary /></div>
      </div>
    </div>
  );
}
