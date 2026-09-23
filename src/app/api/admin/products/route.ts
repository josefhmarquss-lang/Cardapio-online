import { requireOwner } from "@/lib/auth";
import { json, readJson, route } from "@/lib/http";
import { createProduct, listProducts } from "@/lib/repo/catalog";
import { productSchema } from "@/lib/validation";

export const GET = route(async () => {
  const { storeId } = await requireOwner();
  return json({ products: listProducts(storeId) });
});

export const POST = route(async (req) => {
  const { storeId } = await requireOwner();
  const data = productSchema(storeId).parse(await readJson(req));
  return json({ product: createProduct(storeId, data) }, { status: 201 });
});
