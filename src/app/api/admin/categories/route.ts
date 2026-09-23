import { requireOwner } from "@/lib/auth";
import { json, readJson, route } from "@/lib/http";
import { createCategory, listCategories } from "@/lib/repo/catalog";
import { categorySchema } from "@/lib/validation";

export const GET = route(async () => {
  const { storeId } = await requireOwner();
  return json({ categories: listCategories(storeId) });
});

export const POST = route(async (req) => {
  const { storeId } = await requireOwner();
  const data = categorySchema.parse(await readJson(req));
  return json({ category: createCategory(storeId, data) }, { status: 201 });
});
