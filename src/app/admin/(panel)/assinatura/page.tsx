import { BillingPanel } from "@/components/admin/BillingPanel";
import { requireOwnerPage } from "@/lib/auth";
import { billingState } from "@/lib/billing-state";
import { refreshBilling } from "@/lib/repo/billing";
import { listProducts } from "@/lib/repo/catalog";

export default async function BillingPage() {
  const { storeId } = await requireOwnerPage();
  const billing = await refreshBilling(storeId, 60_000);
  return <BillingPanel initial={billing} initialState={billingState(billing)} productCount={listProducts(storeId).length} />;
}
