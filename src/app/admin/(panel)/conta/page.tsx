import { AccountForm } from "@/components/admin/settings/AccountForm";
import { requireOwnerPage } from "@/lib/auth";

export default async function Page() {
  const { user } = await requireOwnerPage();
  return <AccountForm email={user.email} name={user.name} />;
}
