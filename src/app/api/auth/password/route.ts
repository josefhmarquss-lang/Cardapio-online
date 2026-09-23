import { z } from "zod";
import { changePassword, getSessionUser } from "@/lib/auth";
import { HttpError, json, rateLimit, readJson, route } from "@/lib/http";
import { passwordSchema } from "@/lib/validation";

const schema = z.object({ current: z.string().min(1).max(200), next: passwordSchema });

export const POST = route(async (req) => {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Sessão expirada. Entre novamente.");
  rateLimit(`pwd:${user.id}`, 10, 15 * 60_000);
  const { current, next } = schema.parse(await readJson(req));
  await changePassword(user.id, current, next);
  return json({ ok: true });
});
