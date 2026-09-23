import { requireOwner } from "@/lib/auth";
import { json, readJson, route } from "@/lib/http";
import { HttpError } from "@/lib/http";
import { PLANS } from "@/lib/plans";
import { planOf } from "@/lib/repo/billing";
import { createProduct, listProducts } from "@/lib/repo/catalog";
import { productSchema } from "@/lib/validation";

export const GET = route(async () => {
  const { storeId } = await requireOwner();
  return json({ products: listProducts(storeId) });
});

export const POST = route(async (req) => {
  const { storeId } = await requireOwner();
  const data = productSchema(storeId).parse(await readJson(req));
  const plan = PLANS[planOf(storeId)];
  if (plan.max_products !== null && listProducts(storeId).length >= plan.max_products)
    throw new HttpError(403, `Seu plano ${plan.name} permite até ${plan.max_products} produtos. Mude para o Profissional em Assinatura para cadastrar mais.`);
  return json({ product: createProduct(storeId, data) }, { status: 201 });
});
