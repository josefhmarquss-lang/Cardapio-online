import { AppearanceForm } from "@/components/admin/settings/AppearanceForm";
import { requireOwnerPage } from "@/lib/auth";
import { getStoreById } from "@/lib/repo/stores";

export default async function Page() {
  const { storeId } = await requireOwnerPage();
  return <AppearanceForm store={getStoreById(storeId)!} />;
}
