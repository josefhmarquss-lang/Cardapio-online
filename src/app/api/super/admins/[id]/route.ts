import { requireSuperadmin } from "@/lib/auth";
import { HttpError, json, route } from "@/lib/http";
import { listSuperadmins, removeSuperadmin } from "@/lib/repo/platform";

export const DELETE = route(async (_req, ctx: RouteContext<"/api/super/admins/[id]">) => {
  const me = await requireSuperadmin();
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID inválido.");
  removeSuperadmin(id, me.id);
  return json({ admins: listSuperadmins() });
});
