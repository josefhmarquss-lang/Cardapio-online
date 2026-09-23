import { requireOwner } from "@/lib/auth";
import { json, route } from "@/lib/http";
import { markOrdersSeen, orderPulse } from "@/lib/repo/orders";

/** Consultado periodicamente pelo painel para avisar sobre pedidos novos. */
export const GET = route(async () => {
  const { storeId } = await requireOwner();
  const p = orderPulse(storeId);
  return json({ last_id: p.last_id, unseen: p.unseen ?? 0, awaiting: p.awaiting ?? 0 });
});

export const POST = route(async () => {
  const { storeId } = await requireOwner();
  markOrdersSeen(storeId);
  return json({ ok: true });
});
