import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth";
import { HttpError, json, readJson, route } from "@/lib/http";
import { resetOwnerPassword, setStoreActive } from "@/lib/repo/platform";
import { passwordSchema } from "@/lib/validation";

const schema = z.object({ is_active: z.boolean().optional(), new_password: passwordSchema.optional() });

export const PATCH = route(async (req, ctx: RouteContext<"/api/super/stores/[id]">) => {
  await requireSuperadmin();
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID inválido.");
  const body = schema.parse(await readJson(req));
  if (body.is_active !== undefined) setStoreActive(id, body.is_active);
  if (body.new_password) resetOwnerPassword(id, body.new_password);
  return json({ ok: true });
});
