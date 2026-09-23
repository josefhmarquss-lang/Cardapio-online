import type { Metadata } from "next";
import { SuperDashboard } from "@/components/admin/SuperDashboard";
import { requireSuperadminPage } from "@/lib/auth";
import { listStoresOverview, listSuperadmins } from "@/lib/repo/platform";

export const metadata: Metadata = { title: "Plataforma — Estabelecimentos", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SuperPage() {
  const user = await requireSuperadminPage();
  return <SuperDashboard email={user.email} myId={user.id} initial={listStoresOverview()} admins={listSuperadmins()} />;
}
