import { z } from "zod";
import { createSession } from "@/lib/auth";
import { isValidCpfCnpj } from "@/lib/cpf";
import { onlyDigits } from "@/lib/format";
import { clientIp, json, rateLimit, readJson, route } from "@/lib/http";
import { PLAN_IDS, type PlanId } from "@/lib/plans";
import { signupStore } from "@/lib/repo/billing";
import { passwordSchema } from "@/lib/validation";
import { db } from "@/lib/db";

const schema = z.object({
  plan: z.enum(PLAN_IDS as [PlanId, ...PlanId[]]),
  store_name: z.string().trim().min(2, "informe o nome da loja").max(80),
  slug: z.string().trim().max(48).default(""),
  whatsapp: z
    .string()
    .trim()
    .refine((v) => onlyDigits(v).length >= 10 && onlyDigits(v).length <= 13, "WhatsApp com DDD"),
  owner_name: z.string().trim().min(3, "informe seu nome completo").max(80),
  cpf_cnpj: z.string().trim().refine(isValidCpfCnpj, "CPF ou CNPJ inválido"),
  email: z.string().trim().email("e-mail inválido").max(160),
  password: passwordSchema,
});

/** Cadastro automático: cria a assinatura no Asaas, a loja e já entra no painel. */
export const POST = route(async (req) => {
  rateLimit(`signup:${clientIp(req)}`, 5, 60 * 60_000);
  const input = schema.parse(await readJson(req));
  const { storeId } = await signupStore({
    ...input,
    cpf_cnpj: onlyDigits(input.cpf_cnpj),
    // o Asaas espera DDD + número, sem o 55 do país
    whatsapp: onlyDigits(input.whatsapp).replace(/^55(?=\d{10,11}$)/, ""),
  });
  const owner = db().prepare("SELECT id FROM users WHERE store_id = ? AND role = 'owner'").get(storeId) as { id: number };
  await createSession(owner.id);
  return json({ ok: true, redirect: "/admin?bemvindo=1" }, { status: 201 });
});
