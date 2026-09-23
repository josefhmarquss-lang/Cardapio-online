import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/http";
import { handleAsaasEvent } from "@/lib/repo/billing";

function sameToken(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/**
 * Avisos do Asaas (pagamento recebido, vencido etc.). Configure a URL
 * https://SEU-DOMINIO/api/webhooks/asaas no painel do Asaas, com o mesmo token
 * de ASAAS_WEBHOOK_TOKEN. Responde 200 sempre que o token confere, para o
 * Asaas não pausar a fila de avisos.
 */
export async function POST(req: NextRequest) {
  try {
    rateLimit(`asaas-webhook:${clientIp(req)}`, 300, 60_000);
  } catch {
    return new Response("too many", { status: 429 });
  }
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  const got = req.headers.get("asaas-access-token") || "";
  if (expected && !sameToken(got, expected)) return new Response("unauthorized", { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    await handleAsaasEvent(body);
  } catch (e) {
    console.error("[asaas webhook]", e);
  }
  return Response.json({ received: true });
}
