import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export async function GET() {
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;
  try {
    const admin = createAdminClient();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [usersCount, tradesCount, newUsersCount, recentUsers, recentTrades, accountRows] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("paper_trades").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      admin.from("profiles").select("id, email, full_name, role, created_at").order("created_at", { ascending: false }).limit(100),
      admin.from("paper_trades").select("id, user_id, symbol, side, quantity, price, notional, created_at").order("created_at", { ascending: false }).limit(8),
      admin.from("paper_accounts").select("virtual_cash"),
    ]);
    if (usersCount.error || tradesCount.error || newUsersCount.error || recentUsers.error || recentTrades.error || accountRows.error) {
      return NextResponse.json({ error: "Could not read admin metrics. Check the database migration and server service-role key." }, { status: 500 });
    }
    const virtualCash = (accountRows.data ?? []).reduce((sum: number, row: { virtual_cash: number | string | null }) => sum + Number(row.virtual_cash ?? 0), 0);
    return NextResponse.json({
      metrics: { totalUsers: usersCount.count ?? 0, totalPaperTrades: tradesCount.count ?? 0, newUsersThisWeek: newUsersCount.count ?? 0, totalVirtualCash: virtualCash },
      users: recentUsers.data ?? [],
      recentTrades: recentTrades.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Admin service is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the server environment." }, { status: 503 });
  }
}
