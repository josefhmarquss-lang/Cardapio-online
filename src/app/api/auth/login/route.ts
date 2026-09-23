import { z } from "zod";
import { createSession, verifyCredentials } from "@/lib/auth";
import { clientIp, HttpError, json, rateLimit, readJson, resetRateLimit, route } from "@/lib/http";

const schema = z.object({ email: z.string().trim().email("e-mail inválido").max(160), password: z.string().min(1).max(200) });

export const POST = route(async (req) => {
  const { email, password } = schema.parse(await readJson(req));
  const ip = clientIp(req);
  rateLimit(`login:ip:${ip}`, 30, 15 * 60_000);
  rateLimit(`login:email:${email.toLowerCase()}`, 8, 15 * 60_000);
  const user = await verifyCredentials(email, password);
  if (!user) throw new HttpError(401, "E-mail ou senha incorretos.");
  resetRateLimit(`login:email:${email.toLowerCase()}`);
  await createSession(user.id);
  return json({ ok: true, redirect: user.role === "superadmin" ? "/super" : "/admin" });
});
