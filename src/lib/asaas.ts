import "server-only";
import { HttpError } from "./errors";

/**
 * Cliente da API v3 do Asaas. A chave fica só no servidor (variável ASAAS_API_KEY).
 *   ASAAS_ENV=sandbox    -> https://api-sandbox.asaas.com/v3 (testes, sem dinheiro real)
 *   ASAAS_ENV=production -> https://api.asaas.com/v3
 */

/** Lê variáveis tolerando espaços e aspas coladas por engano no painel. */
function env(name: string): string {
  return (process.env[name] || "").trim().replace(/^["']+|["']+$/g, "").trim();
}

export function asaasProduction(): boolean {
  return env("ASAAS_ENV").toLowerCase() === "production";
}

export function asaasConfigured(): boolean {
  return !!env("ASAAS_API_KEY");
}

/** Estado da cobrança automática (para o painel /super). */
export function asaasStatus(): "production" | "sandbox" | "off" {
  if (!asaasConfigured()) return "off";
  return asaasProduction() ? "production" : "sandbox";
}

/**
 * A página de vendas divulga o cadastro automático quando a cobrança real está ligada
 * (ASAAS_ENV=production) ou quando SHOW_SIGNUP=true força os botões (ex.: para testes).
 */
export function asaasLive(): boolean {
  return asaasConfigured() && (asaasProduction() || env("SHOW_SIGNUP").toLowerCase() === "true");
}

function baseUrl() {
  if (env("ASAAS_API_URL")) return env("ASAAS_API_URL").replace(/\/$/, "");
  return asaasProduction() ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
}

type AsaasError = { errors?: { code?: string; description?: string }[] };

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = env("ASAAS_API_KEY");
  if (!key) throw new HttpError(503, "Pagamentos não configurados. Fale com o suporte.");
  let res: Response;
  try {
    res = await fetch(baseUrl() + path, {
      method,
      headers: {
        access_token: key,
        "Content-Type": "application/json",
        "User-Agent": "cardapio-online",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch (e) {
    console.error("[asaas] falha de conexão", method, path, e);
    throw new HttpError(502, "Não foi possível falar com o sistema de pagamentos. Tente novamente em instantes.");
  }
  const data = (await res.json().catch(() => ({}))) as T & AsaasError;
  if (!res.ok) {
    const msg = data.errors?.map((e) => e.description).filter(Boolean).join(" ") || `Erro ${res.status} no sistema de pagamentos.`;
    console.error("[asaas]", method, path, res.status, JSON.stringify(data.errors ?? data).slice(0, 500));
    throw new HttpError(res.status >= 500 ? 502 : 400, msg);
  }
  return data;
}

export type AsaasPayment = {
  id: string;
  subscription?: string;
  customer: string;
  value: number;
  status: string;
  dueDate: string;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  invoiceUrl: string;
  billingType: string;
  deleted?: boolean;
};

export const PAID_STATUSES = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);
export const OPEN_STATUSES = new Set(["PENDING", "OVERDUE"]);

export const asaas = {
  createCustomer: (c: { name: string; email: string; cpfCnpj: string; mobilePhone: string; externalReference: string }) =>
    call<{ id: string }>("POST", "/customers", { ...c, notificationDisabled: false }),

  createSubscription: (s: {
    customer: string;
    value: number;
    nextDueDate: string;
    description: string;
    externalReference: string;
  }) => call<{ id: string; status: string }>("POST", "/subscriptions", { ...s, billingType: "UNDEFINED", cycle: "MONTHLY" }),

  updateSubscription: (id: string, patch: { value?: number; description?: string; updatePendingPayments?: boolean }) =>
    call<{ id: string }>("PUT", `/subscriptions/${encodeURIComponent(id)}`, patch),

  deleteSubscription: (id: string) => call<{ deleted: boolean }>("DELETE", `/subscriptions/${encodeURIComponent(id)}`),

  subscriptionPayments: (id: string) =>
    call<{ data: AsaasPayment[] }>("GET", `/subscriptions/${encodeURIComponent(id)}/payments?limit=50`),

  getPayment: (id: string) => call<AsaasPayment>("GET", `/payments/${encodeURIComponent(id)}`),
};
