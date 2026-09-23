import { DeliveryForm } from "@/components/admin/settings/DeliveryForm";
import { requireOwnerPage } from "@/lib/auth";
import { getStoreById } from "@/lib/repo/stores";

export default async function Page() {
  const { storeId } = await requireOwnerPage();
  return <DeliveryForm store={getStoreById(storeId)!} />;
}
