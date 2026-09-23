import { requireOwner } from "@/lib/auth";
import { json, readJson, route } from "@/lib/http";
import { pruneImages } from "@/lib/repo/images";
import { getStoreById, updateStore } from "@/lib/repo/stores";
import { storePatchSchema } from "@/lib/validation";

export const GET = route(async () => {
  const { storeId } = await requireOwner();
  return json({ store: getStoreById(storeId) });
});

export const PATCH = route(async (req) => {
  const { storeId } = await requireOwner();
  const patch = storePatchSchema(storeId).parse(await readJson(req));
  const store = updateStore(storeId, patch);
  pruneImages(storeId);
  return json({ store });
});
