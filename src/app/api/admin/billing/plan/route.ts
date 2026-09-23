import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { billingState } from "@/lib/billing-state";
import { json, rateLimit, readJson, route } from "@/lib/http";
import { PLAN_IDS, type PlanId } from "@/lib/plans";
import { changePlan } from "@/lib/repo/billing";

export const POST = route(async (req) => {
  const { storeId } = await requireOwner({ allowLocked: true });
  rateLimit(`plan:${storeId}`, 10, 60 * 60_000);
  const { plan } = z.object({ plan: z.enum(PLAN_IDS as [PlanId, ...PlanId[]]) }).parse(await readJson(req));
  const b = await changePlan(storeId, plan);
  return json({ billing: b, state: billingState(b) });
});
