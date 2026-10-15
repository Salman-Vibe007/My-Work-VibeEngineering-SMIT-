import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: productCount }, { count: orderCount }, { data: recentOrders }, { data: revenue }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("id, shipping_name, total, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("orders").select("total").eq("payment_status", "paid"),
  ]);

  const totalRevenue = revenue?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

  const stats = [
    { label: "Total Products", value: productCount || 0, color: "bg-[#4682B4]", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { label: "Total Orders", value: orderCount || 0, color: "bg-[#2E8B57]", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, color: "bg-[#8B4513]", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back. Here&apos;s your store overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-[#4682B4] hover:text-[#5a9fd4]">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-xs text-slate-400 uppercase">Customer</th>
                <th className="text-left py-3 text-xs text-slate-400 uppercase">Total</th>
                <th className="text-left py-3 text-xs text-slate-400 uppercase">Status</th>
                <th className="text-left py-3 text-xs text-slate-400 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.map((order) => (
                <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="py-3 text-slate-200 font-medium">{order.shipping_name}</td>
                  <td className="py-3 text-slate-200">${order.total?.toFixed(2)}</td>
                  <td className="py-3">
                    <span className="px-2.5 py-1 text-xs rounded-full bg-[#4682B4]/20 text-[#4682B4] capitalize font-medium">{order.status}</span>
                  </td>
                  <td className="py-3 text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <tr><td colSpan={4} className="py-8 text-center text-slate-500">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/products" className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 hover:border-[#4682B4]/50 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#4682B4]/20 w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-[#4682B4]/30 transition-colors">
              <svg className="w-5 h-5 text-[#4682B4]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-bold text-white">Manage Products</h3>
          </div>
          <p className="text-sm text-slate-400">Add, edit, or remove products from the catalog.</p>
        </Link>
        <Link href="/admin/orders" className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 hover:border-[#2E8B57]/50 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#2E8B57]/20 w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-[#2E8B57]/30 transition-colors">
              <svg className="w-5 h-5 text-[#2E8B57]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-bold text-white">Manage Orders</h3>
          </div>
          <p className="text-sm text-slate-400">View and update order status and fulfillment.</p>
        </Link>
      </div>
    </div>
  );
}
