"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

export default function CartSummary() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());
  const shipping = total > 500 ? 0 : 25;
  const tax = total * 0.08;
  const grandTotal = total + shipping + tax;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#121212] mb-4">Order Summary</h2>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal ({items.length} items)</span>
          <span className="font-medium">{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Shipping</span>
          <span className="font-medium">{shipping === 0 ? <span className="text-[#2E8B57]">Free</span> : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tax (8%)</span>
          <span className="font-medium">{formatPrice(tax)}</span>
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between">
          <span className="font-bold text-[#121212]">Total</span>
          <span className="font-bold text-[#121212] text-lg">{formatPrice(grandTotal)}</span>
        </div>
      </div>
      {shipping > 0 && <p className="mt-3 text-xs text-[#2E8B57] text-center">Free shipping on orders over $500</p>}
      <Link href="/checkout" className="mt-4 block w-full py-3 bg-[#4682B4] text-white text-center font-medium rounded-lg hover:bg-[#3A6E9A] transition-colors">
        Proceed to Checkout
      </Link>
      <Link href="/products" className="mt-2 block w-full py-2 text-center text-sm text-[#4682B4] hover:text-[#3A6E9A] transition-colors">
        Continue Shopping
      </Link>
    </div>
  );
}