import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, supabase };
  return { user, supabase };
}

export async function requirePageUser() {
  const { user } = await requireUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdminPage() {
  const user = await requirePageUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  return user;
}

export async function requireApiUser() {
  const { user, supabase } = await requireUser();
  if (!user) return { user: null, supabase, response: Response.json({ error: "Authentication required." }, { status: 401 }) };
  return { user, supabase, response: null };
}

export async function requireApiAdmin() {
  const { user, supabase, response } = await requireApiUser();
  if (response || !user) return { user: null, supabase, response };
  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (error || profile?.role !== "admin") {
    return { user: null, supabase, response: Response.json({ error: "Administrator access required." }, { status: 403 }) };
  }
  return { user, supabase, response: null };
}
