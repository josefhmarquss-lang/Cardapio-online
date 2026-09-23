import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth";
import { json, readJson, route } from "@/lib/http";
import { addSuperadmin, listSuperadmins } from "@/lib/repo/platform";
import { passwordSchema } from "@/lib/validation";

export const GET = route(async () => {
  await requireSuperadmin();
  return json({ admins: listSuperadmins() });
});

const schema = z.object({
  name: z.string().trim().max(80).default(""),
  email: z.string().trim().email("e-mail inválido").max(160),
  password: passwordSchema,
});

export const POST = route(async (req) => {
  await requireSuperadmin();
  const { name, email, password } = schema.parse(await readJson(req));
  addSuperadmin(email, name, password);
  return json({ admins: listSuperadmins() }, { status: 201 });
});
