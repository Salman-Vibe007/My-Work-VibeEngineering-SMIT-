"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center animate-slide-up">
      <div className="w-20 h-20 bg-[#2E8B57]/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-[#2E8B57]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-[#121212] mb-4">Order Confirmed!</h1>
      <p className="text-gray-500 mb-2">Thank you for your purchase. Your order has been placed successfully.</p>
      {orderId && <p className="text-sm text-gray-400 mb-8">Order ID: <span className="font-mono text-[#121212]">{orderId}</span></p>}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/profile" className="px-8 py-3 bg-[#4682B4] text-white font-medium rounded-lg hover:bg-[#3A6E9A] transition-colors">View Order History</Link>
        <Link href="/products" className="px-8 py-3 border border-gray-200 font-medium rounded-lg hover:bg-gray-50 transition-colors">Continue Shopping</Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-[#4682B4] border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
