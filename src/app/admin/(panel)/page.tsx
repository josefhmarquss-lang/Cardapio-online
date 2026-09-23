import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { requireOwnerPage } from "@/lib/auth";
import { startOfTodayIso } from "@/lib/hours";
import { listOrders, orderStats } from "@/lib/repo/orders";
import { getStoreById } from "@/lib/repo/stores";

export default async function OrdersPage() {
  const { storeId } = await requireOwnerPage();
  const store = getStoreById(storeId)!;
  const stats = orderStats(storeId, startOfTodayIso(store.timezone));
  return (
    <OrdersBoard
      initial={listOrders(storeId, { filter: "active", limit: 200 })}
      stats={{ count: stats.count, revenue: stats.revenue, open: stats.open ?? 0 }}
      timezone={store.timezone}
      storeName={store.name}
    />
  );
}
