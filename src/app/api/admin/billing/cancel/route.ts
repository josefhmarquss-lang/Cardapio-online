import { requireOwner } from "@/lib/auth";
import { billingState } from "@/lib/billing-state";
import { json, route } from "@/lib/http";
import { cancelSubscription } from "@/lib/repo/billing";

export const POST = route(async () => {
  const { storeId } = await requireOwner({ allowLocked: true });
  const b = await cancelSubscription(storeId);
  return json({ billing: b, state: billingState(b) });
});
