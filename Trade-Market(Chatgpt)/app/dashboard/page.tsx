import { requirePageUser } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard-client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const user = await requirePageUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return <DashboardClient email={user.email ?? ""} fullName={String(user.user_metadata?.full_name ?? "")} isAdmin={profile?.role === "admin"}/>;
}
