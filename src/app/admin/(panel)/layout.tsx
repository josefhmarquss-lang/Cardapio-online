import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireOwnerPage } from "@/lib/auth";
import { billingState } from "@/lib/billing-state";
import { refreshBilling } from "@/lib/repo/billing";
import { getStoreById } from "@/lib/repo/stores";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const { user, storeId } = await requireOwnerPage();
  const store = getStoreById(storeId)!;
  const billing = await refreshBilling(storeId, 10 * 60_000);
  const state = billingState(billing);
  return (
    <AdminShell
      user={{ name: user.name, email: user.email }}
      store={{ name: store.name, slug: store.slug, logo_url: store.logo_url, sound_enabled: store.sound_enabled }}
      billing={{ state, canceled: !!billing.canceled_at, dueDate: billing.open_payment?.due_date ?? null }}
    >
      {children}
    </AdminShell>
  );
}
