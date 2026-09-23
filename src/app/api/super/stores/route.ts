import { z } from "zod";
import { requireSuperadmin } from "@/lib/auth";
import { json, readJson, route } from "@/lib/http";
import { createStoreWithOwner, listStoresOverview } from "@/lib/repo/platform";
import { passwordSchema } from "@/lib/validation";

export const GET = route(async () => {
  await requireSuperadmin();
  return json({ stores: listStoresOverview() });
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(48).optional(),
  owner_name: z.string().trim().max(80).default(""),
  owner_email: z.string().trim().email("e-mail inválido").max(160),
  owner_password: passwordSchema,
  whatsapp: z.string().trim().regex(/^[\d\s()+-]{0,20}$/).optional(),
  template: z.enum(["blank", "pizzaria"]).default("blank"),
});

export const POST = route(async (req) => {
  await requireSuperadmin();
  const input = schema.parse(await readJson(req));
  return json(createStoreWithOwner(input), { status: 201 });
});
