import type { AdminUser, Order, Profile } from "@/types/database";

type RawProfile = Pick<Profile, "id" | "full_name" | "is_admin" | "created_at">;
type RawOrder = Pick<Order, "user_id" | "shipping_email" | "total" | "created_at">;

/**
 * Merges user profiles with their order history into display-ready
 * admin user rows (contact email, order count, lifetime spend, last order).
 */
export function mergeUsersWithOrders(
  profiles: RawProfile[],
  orders: RawOrder[]
): AdminUser[] {
  const byUser = new Map<string, { email: string | null; orders: number; total: number; last: string | null }>();

  for (const order of orders) {
    if (!order.user_id) continue;
    const entry = byUser.get(order.user_id) ?? {
      email: null,
      orders: 0,
      total: 0,
      last: null,
    };
    entry.orders += 1;
    entry.total += order.total ?? 0;
    if (order.shipping_email && !entry.email) entry.email = order.shipping_email;
    if (order.created_at && (!entry.last || order.created_at > entry.last)) {
      entry.last = order.created_at;
    }
    byUser.set(order.user_id, entry);
  }

  return profiles.map((profile) => {
    const entry = byUser.get(profile.id);
    return {
      id: profile.id,
      full_name: profile.full_name,
      email: entry?.email ?? null,
      is_admin: profile.is_admin,
      created_at: profile.created_at,
      order_count: entry?.orders ?? 0,
      total_spent: Math.round((entry?.total ?? 0) * 100) / 100,
      last_order_at: entry?.last ?? null,
    };
  });
}

/** Filters users by name or email (case-insensitive). Empty query returns all. */
export function filterUsers(users: AdminUser[], query: string): AdminUser[] {
  const q = query.trim().toLowerCase();
  if (!q) return users;
  return users.filter(
    (u) =>
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
  );
}
