import { requireOwner } from "@/lib/auth";
import { json, route } from "@/lib/http";
import { listOrders } from "@/lib/repo/orders";

export const GET = route(async (req) => {
  const { storeId } = await requireOwner();
  const f = req.nextUrl.searchParams.get("filter");
  const filter = f === "finished" || f === "all" ? f : "active";
  return json({ orders: listOrders(storeId, { filter, limit: 200 }) });
});
