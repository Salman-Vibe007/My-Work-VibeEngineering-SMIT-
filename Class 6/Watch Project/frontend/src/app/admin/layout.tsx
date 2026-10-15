import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopBar from "@/components/AdminTopBar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin, full_name").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar user={{ fullName: profile.full_name }} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
