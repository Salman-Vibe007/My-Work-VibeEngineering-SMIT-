import { createClient } from "@/lib/supabase/server";
import AdminUsersClient from "@/components/AdminUsersClient";
import { mergeUsersWithOrders } from "@/lib/users";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, is_admin, created_at").order("created_at"),
    supabase.from("orders").select("user_id, shipping_email, total, created_at"),
  ]);

  const users = mergeUsersWithOrders(profiles ?? [], orders ?? []);

  return <AdminUsersClient users={users} currentUserId={user?.id ?? ""} />;
}
