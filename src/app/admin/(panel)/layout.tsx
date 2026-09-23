import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireOwnerPage } from "@/lib/auth";
import { getStoreById } from "@/lib/repo/stores";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const { user, storeId } = await requireOwnerPage();
  const store = getStoreById(storeId)!;
  return (
    <AdminShell
      user={{ name: user.name, email: user.email }}
      store={{ name: store.name, slug: store.slug, logo_url: store.logo_url, sound_enabled: store.sound_enabled }}
    >
      {children}
    </AdminShell>
  );
}
