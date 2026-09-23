import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { HttpError, json, readJson, route } from "@/lib/http";
import { deleteProduct, setProductAvailability, updateProduct } from "@/lib/repo/catalog";
import { pruneImages } from "@/lib/repo/images";
import { productSchema } from "@/lib/validation";

type Ctx = RouteContext<"/api/admin/products/[id]">;

async function idOf(ctx: Ctx) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID inválido.");
  return id;
}

export const PUT = route(async (req, ctx: Ctx) => {
  const { storeId } = await requireOwner();
  const data = productSchema(storeId).parse(await readJson(req));
  const product = updateProduct(storeId, await idOf(ctx), data);
  pruneImages(storeId);
  return json({ product });
});

/** Alteração rápida de disponibilidade. */
export const PATCH = route(async (req, ctx: Ctx) => {
  const { storeId } = await requireOwner();
  const { is_available } = z.object({ is_available: z.boolean() }).parse(await readJson(req));
  return json({ product: setProductAvailability(storeId, await idOf(ctx), is_available) });
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  const { storeId } = await requireOwner();
  deleteProduct(storeId, await idOf(ctx));
  pruneImages(storeId);
  return json({ ok: true });
});
