import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export async function GET() {
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("profiles").select("id, email, full_name, role, created_at").order("created_at", { ascending: false }).limit(100);
    if (error) return NextResponse.json({ error: "Could not load users." }, { status: 500 });
    return NextResponse.json({ users: data ?? [] });
  } catch { return NextResponse.json({ error: "Admin service is not configured." }, { status: 503 }); }
}
