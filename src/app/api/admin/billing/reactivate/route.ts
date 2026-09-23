import { requireOwner } from "@/lib/auth";
import { billingState } from "@/lib/billing-state";
import { json, rateLimit, route } from "@/lib/http";
import { reactivateSubscription } from "@/lib/repo/billing";
import { getStoreById } from "@/lib/repo/stores";

export const POST = route(async () => {
  const { storeId } = await requireOwner({ allowLocked: true });
  rateLimit(`reactivate:${storeId}`, 5, 60 * 60_000);
  const b = await reactivateSubscription(storeId, getStoreById(storeId)!.name);
  return json({ billing: b, state: billingState(b) });
});
