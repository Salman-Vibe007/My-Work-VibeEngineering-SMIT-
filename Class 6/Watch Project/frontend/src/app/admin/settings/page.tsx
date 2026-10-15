import { createClient } from "@/lib/supabase/server";
import AdminSettingsClient from "@/components/AdminSettingsClient";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();

  return <AdminSettingsClient email={user!.email || ""} fullName={profile?.full_name || ""} />;
}
