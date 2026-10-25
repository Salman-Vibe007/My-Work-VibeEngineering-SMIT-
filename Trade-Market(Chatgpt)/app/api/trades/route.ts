import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getQuote, MarketDataError } from "@/lib/market-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidSymbol } from "@/lib/utils";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  let body: { symbol?: string; side?: string; quantity?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  const side = body.side;
  const quantity = Number(body.quantity);
  if (!isValidSymbol(symbol)) return NextResponse.json({ error: "Enter a valid ticker symbol." }, { status: 400 });
  if (side !== "buy" && side !== "sell") return NextResponse.json({ error: "Side must be buy or sell." }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000 || Math.round(quantity * 1000000) !== quantity * 1000000) {
    return NextResponse.json({ error: "Quantity must be positive, at most 100,000, and use no more than six decimal places." }, { status: 400 });
  }
  try {
    // The server fetches its own quote; it never trusts a price submitted by the browser.
    const quote = await getQuote(symbol);
    // Use the server-only service role after this route verified the caller's session.
    // The RPC itself is not executable by regular authenticated browser clients.
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("execute_paper_trade", {
      p_user_id: auth.user.id, p_symbol: symbol, p_side: side, p_quantity: quantity, p_price: quote.price,
    });
    if (error) {
      const message = error.message.includes("Insufficient virtual cash") || error.message.includes("Not enough shares") || error.message.includes("Quantity") || error.message.includes("Invalid symbol")
        ? error.message : "The simulated trade could not be completed. Check the database migration and try again.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ result: data, quote, message: `${side === "buy" ? "Paper buy" : "Paper sell"} completed at the latest provider quote.` });
  } catch (error) {
    const issue = error instanceof MarketDataError ? error : new MarketDataError("Could not complete the simulated trade. Verify the server-only Supabase service-role key and market-data configuration.", 503);
    return NextResponse.json({ error: issue.message }, { status: issue.status });
  }
}
