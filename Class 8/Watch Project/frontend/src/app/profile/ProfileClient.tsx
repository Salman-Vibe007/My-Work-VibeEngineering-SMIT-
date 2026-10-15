"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  profile: { full_name: string | null; phone: string | null; is_admin: boolean } | null;
  orders: Array<{
    id: string; status: string; total: number; created_at: string;
    order_items: Array<{ product_name: string; product_brand: string; quantity: number; price: number }>;
  }>;
}

export default function ProfileClient({ user, profile, orders }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");

    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    setPwSaving(true);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email || "",
      password: currentPassword,
    });

    if (signInError) {
      setPwError("Current password is incorrect.");
      setPwSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setPwError(updateError.message);
      setPwSaving(false);
      return;
    }

    setPwSaving(false);
    setPwSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPwSaved(false), 2000);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700", processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700", delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#121212]">My Profile</h1>
        {profile?.is_admin && (
          <a href="/admin" className="px-4 py-2 bg-[#8B4513] text-white text-sm font-medium rounded-lg hover:bg-[#A0522D] transition-colors">Admin Dashboard</a>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[#121212]">Account Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={user.email || ""} disabled className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-2.5 bg-[#4682B4] text-white font-medium rounded-lg hover:bg-[#3A6E9A] transition-colors disabled:bg-gray-300">
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </form>
          <form onSubmit={handlePasswordChange} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4 mt-6">
            <h2 className="text-lg font-bold text-[#121212]">Change Password</h2>
            {pwError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pwError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50" />
            </div>
            <button type="submit" disabled={pwSaving}
              className="w-full py-2.5 bg-[#8B4513] text-white font-medium rounded-lg hover:bg-[#A0522D] transition-colors disabled:bg-gray-300">
              {pwSaving ? "Updating..." : pwSaved ? "Password Updated!" : "Update Password"}
            </button>
          </form>
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-[#121212] mb-4">Order History</h2>
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm text-center"><p className="text-gray-500">No orders yet.</p></div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                      <p className="text-xs text-gray-400 font-mono">{order.id.slice(0, 8)}...</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}>{order.status}</span>
                      <span className="font-bold text-[#121212]">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-50 pt-3 space-y-1">
                    {order.order_items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-500">{item.product_brand} - {item.product_name} x {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
