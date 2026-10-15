import { createClient } from "@/lib/supabase/server";
import AdminOrdersClient from "@/components/AdminOrdersClient";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
  return <AdminOrdersClient orders={orders || []} />;
}
