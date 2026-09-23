import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTracker } from "@/components/menu/OrderTracker";
import { storeThemeVars } from "@/lib/colors";
import { toPublicStore } from "@/lib/public-store";
import { getOrderByToken } from "@/lib/repo/orders";
import { getStoreById } from "@/lib/repo/stores";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acompanhe seu pedido", robots: { index: false } };

export default async function OrderPage(props: PageProps<"/[slug]/pedido/[token]">) {
  const { slug, token } = await props.params;
  const order = getOrderByToken(token);
  const store = order ? getStoreById(order.store_id) : null;
  if (!order || !store || store.slug !== slug) notFound();
  return (
    <div style={storeThemeVars(store)} className="min-h-dvh bg-page text-ink-main">
      <OrderTracker store={toPublicStore(store)} order={order} />
    </div>
  );
}
