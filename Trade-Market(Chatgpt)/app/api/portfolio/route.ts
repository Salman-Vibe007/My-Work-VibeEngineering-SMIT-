import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export async function GET() {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  const [accountResult, positionsResult, tradesResult] = await Promise.all([
    auth.supabase.from("paper_accounts").select("user_id, virtual_cash, updated_at").eq("user_id", auth.user.id).maybeSingle(),
    auth.supabase.from("paper_positions").select("symbol, quantity, average_price, updated_at").eq("user_id", auth.user.id).order("symbol"),
    auth.supabase.from("paper_trades").select("id, symbol, side, quantity, price, notional, created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(10),
  ]);
  if (accountResult.error || positionsResult.error || tradesResult.error) {
    return NextResponse.json({ error: "Could not load portfolio. Check that the Supabase migration has been applied." }, { status: 500 });
  }
  return NextResponse.json({ account: accountResult.data ?? { user_id: auth.user.id, virtual_cash: 10000, updated_at: new Date().toISOString() }, positions: positionsResult.data ?? [], trades: tradesResult.data ?? [] });
}
