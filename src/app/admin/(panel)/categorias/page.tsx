import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { requireOwnerPage } from "@/lib/auth";
import { listCategories, listProducts } from "@/lib/repo/catalog";

export default async function CategoriesPage() {
  const { storeId } = await requireOwnerPage();
  const products = listProducts(storeId);
  const counts: Record<number, number> = {};
  for (const p of products) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
  return <CategoriesManager initial={listCategories(storeId)} counts={counts} />;
}
