import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuApp } from "@/components/menu/MenuApp";
import { storeThemeVars } from "@/lib/colors";
import { isOpenNow } from "@/lib/hours";
import { toPublicStore } from "@/lib/public-store";
import { getPublicMenu } from "@/lib/repo/catalog";
import { getStoreBySlug } from "@/lib/repo/stores";

// sempre renderiza com os dados atuais do banco: alterações do painel aparecem na hora
export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const store = getStoreBySlug((await props.params).slug);
  if (!store || !store.is_active) return { title: "Cardápio não encontrado" };
  const image = store.banner_url || store.logo_url || undefined;
  return {
    title: `${store.name} — Cardápio online`,
    description: store.tagline || `Veja o cardápio e faça seu pedido na ${store.name}.`,
    openGraph: { title: store.name, description: store.tagline, images: image ? [image] : undefined },
    icons: store.logo_url ? { icon: store.logo_url } : undefined,
  };
}

export default async function StoreMenuPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const store = getStoreBySlug(slug);
  if (!store || !store.is_active) notFound();
  const menu = getPublicMenu(store.id);
  return (
    <div style={storeThemeVars(store)}>
      <meta name="theme-color" content={store.primary_color} />
      <MenuApp store={toPublicStore(store)} menu={menu} initialOpen={isOpenNow(store.opening_hours, store.open_mode, store.timezone)} />
    </div>
  );
}
