import { createClient } from "@/lib/supabase/server";
import AdminProductsClient from "@/components/AdminProductsClient";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  return <AdminProductsClient products={products || []} />;
}
