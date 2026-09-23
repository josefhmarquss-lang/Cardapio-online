import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { HttpError, json, readJson, route } from "@/lib/http";
import { getOrder, updateOrderStatus } from "@/lib/repo/orders";

type Ctx = RouteContext<"/api/admin/orders/[id]">;

async function idOf(ctx: Ctx) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID inválido.");
  return id;
}

export const GET = route(async (_req, ctx: Ctx) => {
  const { storeId } = await requireOwner();
  return json({ order: getOrder(storeId, await idOf(ctx)) });
});

export const PATCH = route(async (req, ctx: Ctx) => {
  const { storeId } = await requireOwner();
  const { status } = z
    .object({ status: z.enum(["new", "received", "preparing", "out_for_delivery", "completed", "cancelled"]) })
    .parse(await readJson(req));
  return json({ order: updateOrderStatus(storeId, await idOf(ctx), status) });
});
