import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getQuote, MarketDataError } from "@/lib/market-data";
import { isValidSymbol } from "@/lib/utils";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const symbol = (request.nextUrl.searchParams.get("symbol") ?? "AAPL").trim().toUpperCase();
  if (!isValidSymbol(symbol)) return NextResponse.json({ error: "Invalid ticker symbol." }, { status: 400 });
  try { return NextResponse.json(await getQuote(symbol), { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" } }); }
  catch (error) {
    const issue = error instanceof MarketDataError ? error : new MarketDataError("Unable to retrieve market data.");
    return NextResponse.json({ error: issue.message }, { status: issue.status });
  }
}
