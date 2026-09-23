import { requireOwner } from "@/lib/auth";
import { billingState } from "@/lib/billing-state";
import { json, route } from "@/lib/http";
import { refreshBilling } from "@/lib/repo/billing";

/** Situação da assinatura; ?atualizar=1 consulta o Asaas na hora ("Já paguei"). */
export const GET = route(async (req) => {
  const { storeId } = await requireOwner({ allowLocked: true });
  const force = req.nextUrl.searchParams.get("atualizar") === "1";
  const b = await refreshBilling(storeId, force ? 0 : 60_000);
  return json({ billing: b, state: billingState(b) });
});
