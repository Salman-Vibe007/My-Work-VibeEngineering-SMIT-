import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: orders } = await supabase
    .from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false });

  return <ProfileClient user={user} profile={profile} orders={orders || []} />;
}
