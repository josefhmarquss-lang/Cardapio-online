import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { requireOwnerPage } from "@/lib/auth";
import { startOfTodayIso } from "@/lib/hours";
import { listProducts } from "@/lib/repo/catalog";
import { listOrders, orderStats } from "@/lib/repo/orders";
import { getStoreById } from "@/lib/repo/stores";

export default async function OrdersPage() {
  const { storeId } = await requireOwnerPage();
  const store = getStoreById(storeId)!;
  const stats = orderStats(storeId, startOfTodayIso(store.timezone));
  const steps = {
    logo: !!store.logo_url,
    info: !!store.whatsapp && !!store.address_street,
    products: listProducts(storeId).length > 0,
    payment: !!store.pix_key || (!store.pay_pix && (store.pay_cash || store.pay_card)),
    slug: store.slug,
  };
  const showOnboarding = !(steps.logo && steps.info && steps.products && steps.payment);
  return (
    <OrdersBoard
      initial={listOrders(storeId, { filter: "active", limit: 200 })}
      stats={{ count: stats.count, revenue: stats.revenue, open: stats.open ?? 0 }}
      timezone={store.timezone}
      storeName={store.name}
      onboarding={showOnboarding ? steps : null}
    />
  );
}
