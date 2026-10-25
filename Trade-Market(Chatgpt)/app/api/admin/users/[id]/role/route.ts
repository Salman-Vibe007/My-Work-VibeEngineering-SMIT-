import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiAdmin();
  if (auth.response || !auth.user) return auth.response;
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
  if (id === auth.user.id) return NextResponse.json({ error: "You cannot change your own administrator role." }, { status: 400 });
  let body: { role?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (body.role !== "user" && body.role !== "admin") return NextResponse.json({ error: "Role must be user or admin." }, { status: 400 });
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("profiles").update({ role: body.role }).eq("id", id).select("id, email, full_name, role, created_at").maybeSingle();
    if (error) return NextResponse.json({ error: "Could not update role." }, { status: 500 });
    if (!data) return NextResponse.json({ error: "User not found." }, { status: 404 });
    return NextResponse.json({ user: data });
  } catch { return NextResponse.json({ error: "Admin service is not configured." }, { status: 503 }); }
}
