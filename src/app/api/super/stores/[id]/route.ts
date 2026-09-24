import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth";
import { HttpError, json, readJson, route } from "@/lib/http";
import { changePlan, deleteStorePermanently, setManualBilling } from "@/lib/repo/billing";
import { resetOwnerPassword, setStoreActive } from "@/lib/repo/platform";
import { passwordSchema } from "@/lib/validation";

const schema = z.object({
  is_active: z.boolean().optional(),
  new_password: passwordSchema.optional(),
  plan: z.enum(["essencial", "profissional"]).optional(),
  billing_mode: z.literal("manual").optional(),
});

export const PATCH = route(async (req, ctx: RouteContext<"/api/super/stores/[id]">) => {
  await requireSuperadmin();
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID inválido.");
  const body = schema.parse(await readJson(req));
  if (body.is_active !== undefined) setStoreActive(id, body.is_active);
  if (body.new_password) resetOwnerPassword(id, body.new_password);
  if (body.plan) await changePlan(id, body.plan);
  if (body.billing_mode === "manual") await setManualBilling(id);
  return json({ ok: true });
});

/** Exclusão definitiva (só para lojas desativadas). */
export const DELETE = route(async (_req, ctx: RouteContext<"/api/super/stores/[id]">) => {
  await requireSuperadmin();
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID inválido.");
  await deleteStorePermanently(id);
  return json({ ok: true });
});
