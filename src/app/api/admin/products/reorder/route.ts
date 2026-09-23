import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { json, readJson, route } from "@/lib/http";
import { reorderProducts } from "@/lib/repo/catalog";

export const POST = route(async (req) => {
  const { storeId } = await requireOwner();
  const { ids } = z.object({ ids: z.array(z.number().int().positive()).max(2000) }).parse(await readJson(req));
  reorderProducts(storeId, ids);
  return json({ ok: true });
});
