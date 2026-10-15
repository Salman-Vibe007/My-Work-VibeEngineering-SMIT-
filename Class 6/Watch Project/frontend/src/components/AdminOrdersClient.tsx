"use client";

import { useState, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  shipping_name: string;
  shipping_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  payment_status: string;
  created_at: string;
  order_items: OrderItem[];
}

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  processing: "bg-blue-500/20 text-blue-400",
  shipped: "bg-purple-500/20 text-purple-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function AdminOrdersClient({ orders }: { orders: Order[] }) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setStatusUpdates((prev) => ({ ...prev, [orderId]: newStatus }));
  };

  const handleUpdateStatus = async (orderId: string) => {
    const newStatus = statusUpdates[orderId];
    if (!newStatus) return;

    setUpdatingId(orderId);
    const supabase = createClient();

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      setStatusUpdates((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }

    setUpdatingId(null);
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-slate-400 text-sm mt-1">{orders.length} total orders</p>
      </div>
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {orders.map((order) => {
                const currentStatus = statusUpdates[order.id] ?? order.status;
                const isExpanded = expandedOrderId === order.id;
                const isUpdating = updatingId === order.id;

                return (
                  <Fragment key={order.id}>
                    <tr className="hover:bg-slate-700/20">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-slate-300">{order.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-200">{order.shipping_name}</div>
                        <div className="text-xs text-slate-400">{order.shipping_email}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-200">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <select
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium border-0 focus:ring-2 focus:ring-[#4682B4] ${STATUS_COLORS[currentStatus] ?? "bg-slate-700 text-slate-300"}`}
                            disabled={isUpdating}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                            ))}
                          </select>
                          {statusUpdates[order.id] && (
                            <button onClick={() => handleUpdateStatus(order.id)} disabled={isUpdating}
                              className="rounded-lg bg-[#4682B4] px-3 py-1.5 text-xs text-white font-medium hover:bg-[#3A6E9A] disabled:opacity-50 transition-colors">
                              {isUpdating ? "Saving..." : "Save"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button onClick={() => toggleExpand(order.id)} className="text-[#4682B4] hover:text-[#5a9fd4] font-medium">
                          {isExpanded ? "Hide" : "Details"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-slate-800/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-200 mb-2">Shipping Address</h4>
                              <p className="text-sm text-slate-400">{order.shipping_name}</p>
                              <p className="text-sm text-slate-400">{order.shipping_address}</p>
                              <p className="text-sm text-slate-400">{order.shipping_city}, {order.shipping_postal_code}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-200 mb-2">Order Items</h4>
                              <ul className="divide-y divide-slate-700">
                                {order.order_items.map((item) => (
                                  <li key={item.id} className="py-2 flex justify-between text-sm">
                                    <span className="text-slate-400">{item.product_name} x {item.quantity}</span>
                                    <span className="text-slate-200 font-medium">{formatPrice(item.price * item.quantity)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
