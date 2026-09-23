import { ProductsManager } from "@/components/admin/ProductsManager";
import { requireOwnerPage } from "@/lib/auth";
import { listCategories, listProducts } from "@/lib/repo/catalog";

export default async function ProductsPage() {
  const { storeId } = await requireOwnerPage();
  return <ProductsManager initialCategories={listCategories(storeId)} initialProducts={listProducts(storeId)} />;
}
