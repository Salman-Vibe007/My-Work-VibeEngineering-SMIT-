import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { getQuote, MarketDataError } from "@/lib/market-data";
import { isValidSymbol } from "@/lib/utils";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth.response;
  const baseUrl = process.env.AI_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!baseUrl || !apiKey || !model || apiKey === "YOUR_AI_PROVIDER_API_KEY" || model === "YOUR_MODEL_NAME") {
    return NextResponse.json({ error: "The AI learning assistant is not configured. Add AI_BASE_URL, AI_API_KEY, and AI_MODEL in your server environment." }, { status: 503 });
  }
  let body: { message?: string; symbol?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const message = String(body.message ?? "").trim();
  const symbol = String(body.symbol ?? "AAPL").trim().toUpperCase();
  if (!message || message.length > 1200) return NextResponse.json({ error: "Message must contain 1–1,200 characters." }, { status: 400 });
  if (!isValidSymbol(symbol)) return NextResponse.json({ error: "Invalid ticker symbol." }, { status: 400 });

  try {
    const [quote, positionsResult] = await Promise.all([
      getQuote(symbol),
      auth.supabase.from("paper_positions").select("symbol, quantity, average_price").eq("user_id", auth.user.id),
    ]);
    const context = {
      selected_market_quote: { symbol: quote.symbol, name: quote.name, price: quote.price, change: quote.change, percent_change: quote.percentChange, timestamp: quote.timestamp, source: quote.source },
      paper_positions: positionsResult.data ?? [],
      account_type: "simulated virtual-cash portfolio; no brokerage connection and no real orders",
    };
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are FinAlly, a finance-learning assistant inside a simulated paper-trading app. Explain market concepts and summarize supplied data without promising returns or giving personalized financial directives. Never place, propose automatic execution of, or claim to execute any trade. This app is educational and is not investment advice. State uncertainty and data timestamps when relevant. Use only the context provided for current quote claims; do not invent fresh prices or news. Keep answers clear, concise, and age-appropriate." },
          { role: "system", content: `Current verified context from the server (JSON): ${JSON.stringify(context)}` },
          { role: "user", content: message },
        ],
      }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({})) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
    if (!response.ok) return NextResponse.json({ error: data.error?.message || `AI provider request failed (${response.status}).` }, { status: 502 });
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) return NextResponse.json({ error: "AI provider returned an empty response." }, { status: 502 });
    return NextResponse.json({ answer, source: "Configured AI provider", quoteTimestamp: quote.timestamp });
  } catch (error) {
    if (error instanceof MarketDataError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not contact the AI provider. Check its base URL, model name, API key, and server logs." }, { status: 502 });
  }
}
