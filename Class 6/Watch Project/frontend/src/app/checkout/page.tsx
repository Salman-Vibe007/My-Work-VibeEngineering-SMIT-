"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { ShippingInfo } from "@/types/database";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotal } = useCartStore();
  const total = getTotal();
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [shipping, setShipping] = useState<ShippingInfo>({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items.length, router]);

  useEffect(() => {
    if (user) {
      setShipping((prev) => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const subtotal = total;
  const shippingCost = subtotal >= 500 ? 0 : 25;
  const tax = subtotal * 0.08;
  const orderTotal = subtotal + shippingCost + tax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const isStep1Valid =
    shipping.name &&
    shipping.email &&
    shipping.address &&
    shipping.city &&
    shipping.postalCode &&
    shipping.country;

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const supabase = createClient();
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          status: "confirmed",
          total: orderTotal,
          shipping_name: shipping.name,
          shipping_email: shipping.email,
          shipping_address: shipping.address,
          shipping_city: shipping.city,
          shipping_state: shipping.state || null,
          shipping_postal_code: shipping.postalCode,
          shipping_country: shipping.country,
          payment_method: "mock",
          payment_status: "paid",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_brand: item.product.brand,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      for (const item of items) {
        await supabase
          .from("products")
          .update({ stock: item.product.stock - item.quantity })
          .eq("id", item.product.id);
      }

      clearCart();
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 1
                  ? "bg-[#4682B4] text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <span className="ml-2 font-medium text-gray-700">Shipping</span>
          </div>
          <div
            className={`w-24 h-1 mx-4 ${
              step >= 2 ? "bg-[#4682B4]" : "bg-gray-200"
            }`}
          />
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 2
                  ? "bg-[#4682B4] text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium text-gray-700">Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-xl font-semibold mb-6">
                  Shipping Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={shipping.name}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={shipping.email}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={shipping.address}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shipping.city}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={shipping.state}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={shipping.postalCode}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={shipping.country}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <Link
                    href="/cart"
                    className="border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back to Cart
                  </Link>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                    className="bg-[#4682B4] hover:bg-[#3A6E9A] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-xl font-semibold mb-6">
                  Payment Summary
                </h2>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping to</span>
                    <span className="font-medium">
                      {shipping.name}, {shipping.address}, {shipping.city},{" "}
                      {shipping.country}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium">Mock Payment (Demo)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{shipping.email}</span>
                  </div>
                </div>

                <div className="border-t pt-6 mb-8">
                  <h3 className="font-semibold mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.product.brand} &middot; Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="font-medium">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setStep(1)}
                    className="border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back to Shipping
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="bg-[#2E8B57] hover:bg-[#236B45] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {processing
                      ? "Processing..."
                      : `Pay ${formatPrice(orderTotal)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-start"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.product.brand} &middot; Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium ml-2">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (8%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">
                      {formatPrice(orderTotal)}
                    </span>
                  </div>
                </div>
              </div>
              {subtotal < 500 && (
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Add {formatPrice(500 - subtotal)} more for free shipping
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
