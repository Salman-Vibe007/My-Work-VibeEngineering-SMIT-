import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { isValidSymbol } from "@/lib/utils";

const STARTER_SYMBOLS = ["AAPL", "MSFT", "NVDA", "GOOGL", "TSLA"];
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  const { data, error } = await auth.supabase.from("watchlist").select("symbol, created_at").eq("user_id", auth.user.id).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Could not load watchlist. Run the Supabase migration first." }, { status: 500 });
  if (!data?.length) {
    const rows = STARTER_SYMBOLS.map((symbol) => ({ user_id: auth.user!.id, symbol }));
    const { data: seeded, error: seedError } = await auth.supabase.from("watchlist").insert(rows).select("symbol, created_at");
    if (seedError) return NextResponse.json({ watchlist: data ?? [] });
    return NextResponse.json({ watchlist: seeded ?? [] });
  }
  return NextResponse.json({ watchlist: data });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  let body: { symbol?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  if (!isValidSymbol(symbol)) return NextResponse.json({ error: "Enter a valid ticker symbol." }, { status: 400 });
  const { data, error } = await auth.supabase.from("watchlist").upsert({ user_id: auth.user.id, symbol }, { onConflict: "user_id,symbol", ignoreDuplicates: true }).select("symbol").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not update watchlist." }, { status: 500 });
  return NextResponse.json({ symbol: data?.symbol ?? symbol });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  const symbol = (request.nextUrl.searchParams.get("symbol") ?? "").trim().toUpperCase();
  if (!isValidSymbol(symbol)) return NextResponse.json({ error: "Invalid ticker symbol." }, { status: 400 });
  const { error } = await auth.supabase.from("watchlist").delete().eq("user_id", auth.user.id).eq("symbol", symbol);
  if (error) return NextResponse.json({ error: "Could not remove symbol from watchlist." }, { status: 500 });
  return NextResponse.json({ success: true });
}
