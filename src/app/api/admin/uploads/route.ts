import { requireOwner } from "@/lib/auth";
import { HttpError, json, rateLimit, route } from "@/lib/http";
import { MAX_IMAGE_BYTES, saveImage } from "@/lib/repo/images";

export const POST = route(async (req) => {
  const { storeId } = await requireOwner();
  rateLimit(`upload:${storeId}`, 120, 60 * 60_000);
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_IMAGE_BYTES + 64 * 1024) throw new HttpError(413, "Imagem muito grande (máx. 4 MB).");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") throw new HttpError(400, "Nenhum arquivo enviado.");
  const url = saveImage(storeId, Buffer.from(await file.arrayBuffer()));
  return json({ url }, { status: 201 });
});
