import { PaymentForm } from "@/components/admin/settings/PaymentForm";
import { requireOwnerPage } from "@/lib/auth";
import { getStoreById } from "@/lib/repo/stores";

export default async function Page() {
  const { storeId } = await requireOwnerPage();
  return <PaymentForm store={getStoreById(storeId)!} />;
}
