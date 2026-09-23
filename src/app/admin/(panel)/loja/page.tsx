import { StoreInfoForm } from "@/components/admin/settings/StoreInfoForm";
import { requireOwnerPage } from "@/lib/auth";
import { getStoreById } from "@/lib/repo/stores";

export default async function Page() {
  const { storeId } = await requireOwnerPage();
  return <StoreInfoForm store={getStoreById(storeId)!} />;
}
