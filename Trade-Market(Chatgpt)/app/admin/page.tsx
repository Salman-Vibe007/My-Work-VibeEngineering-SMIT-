import { requireAdminPage } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await requireAdminPage();
  return <AdminDashboard adminEmail={user.email ?? ""} adminId={user.id}/>;
}
