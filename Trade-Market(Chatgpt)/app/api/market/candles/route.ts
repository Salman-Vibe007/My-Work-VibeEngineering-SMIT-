import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getCandles, MarketDataError } from "@/lib/market-data";
import { isValidSymbol } from "@/lib/utils";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const symbol = (request.nextUrl.searchParams.get("symbol") ?? "AAPL").trim().toUpperCase();
  const period = (request.nextUrl.searchParams.get("period") ?? "1M").toUpperCase();
  if (!isValidSymbol(symbol)) return NextResponse.json({ error: "Invalid ticker symbol." }, { status: 400 });
  if (!["1D", "1W", "1M", "3M", "1Y"].includes(period)) return NextResponse.json({ error: "Unsupported chart period." }, { status: 400 });
  try { return NextResponse.json(await getCandles(symbol, period), { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" } }); }
  catch (error) {
    const issue = error instanceof MarketDataError ? error : new MarketDataError("Unable to retrieve historical market data.");
    return NextResponse.json({ error: issue.message }, { status: issue.status });
  }
}
