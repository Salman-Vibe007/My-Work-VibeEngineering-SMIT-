"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { filterUsers } from "@/lib/users";
import type { AdminUser } from "@/types/database";

interface AdminUsersClientProps {
  users: AdminUser[];
  currentUserId: string;
}

export default function AdminUsersClient({ users: initialUsers, currentUserId }: AdminUsersClientProps) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const visibleUsers = useMemo(() => filterUsers(users, query), [users, query]);

  const toggleAdmin = async (user: AdminUser) => {
    setBusyId(user.id);
    setError(null);
    const prev = user.is_admin;
    // Optimistic update
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === user.id ? { ...u, is_admin: !prev } : u))
    );
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_admin: !prev })
      .eq("id", user.id);
    if (updateError) {
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === user.id ? { ...u, is_admin: prev } : u))
      );
      setError(`Failed to update role for ${user.full_name ?? "user"}.`);
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-1">
            {users.length} registered user{users.length === 1 ? "" : "s"}
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          aria-label="Search users"
          className="w-64 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4682B4]/50"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded-lg px-4 py-3" role="alert">
          {error}
        </div>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Joined</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Orders</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Total Spent</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Role</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => {
              const isSelf = user.id === currentUserId;
              const isBusy = busyId === user.id;
              return (
                <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-200 font-medium">
                      {user.full_name ?? "—"}
                      {isSelf && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{user.email ?? "no email on file"}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-200">{user.order_count}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">{formatPrice(user.total_spent)}</td>
                  <td className="px-4 py-3 text-sm">
                    {user.is_admin ? (
                      <span className="bg-yellow-500/20 text-yellow-400 text-xs font-medium px-2 py-0.5 rounded">Admin</span>
                    ) : (
                      <span className="bg-slate-500/20 text-slate-300 text-xs font-medium px-2 py-0.5 rounded">Customer</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => toggleAdmin(user)}
                      disabled={isSelf || isBusy}
                      title={isSelf ? "You cannot change your own role" : undefined}
                      className={
                        user.is_admin
                          ? "text-red-400 hover:text-red-300 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          : "text-[#2E8B57] hover:text-green-300 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      }
                    >
                      {isBusy ? "Updating..." : user.is_admin ? "Revoke admin" : "Make admin"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {visibleUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {query ? "No users match your search." : "No users found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
