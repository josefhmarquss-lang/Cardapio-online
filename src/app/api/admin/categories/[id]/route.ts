import { requireOwner } from "@/lib/auth";
import { HttpError, json, readJson, route } from "@/lib/http";
import { deleteCategory, updateCategory } from "@/lib/repo/catalog";
import { categorySchema } from "@/lib/validation";

type Ctx = RouteContext<"/api/admin/categories/[id]">;

async function idOf(ctx: Ctx) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID inválido.");
  return id;
}

export const PUT = route(async (req, ctx: Ctx) => {
  const { storeId } = await requireOwner();
  const data = categorySchema.parse(await readJson(req));
  return json({ category: updateCategory(storeId, await idOf(ctx), data) });
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  const { storeId } = await requireOwner();
  deleteCategory(storeId, await idOf(ctx));
  return json({ ok: true });
});
