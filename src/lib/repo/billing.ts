import "server-only";
import { asaas, asaasConfigured, OPEN_STATUSES, PAID_STATUSES, type AsaasPayment } from "../asaas";
import { addDays, addMonths, billingState, maxYmd, todayYmd, type BillingInfo } from "../billing-state";
import { db } from "../db";
import { HttpError } from "../errors";
import { isPlanId, PLANS, TRIAL_DAYS, type PlanId } from "../plans";
import { checkAvailability, createStoreWithOwner } from "./platform";

export type PaymentSummary = {
  id: string;
  value_cents: number;
  status: string;
  due_date: string;
  paid_date: string | null;
  invoice_url: string;
};

export type BillingRow = BillingInfo & {
  store_id: number;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  open_payment: PaymentSummary | null;
  payments: PaymentSummary[];
  synced_at: string | null;
};

type Raw = Record<string, unknown>;

export function getBilling(storeId: number): BillingRow {
  const r = db().prepare("SELECT * FROM store_billing WHERE store_id = ?").get(storeId) as Raw | undefined;
  if (!r)
    return {
      store_id: storeId,
      mode: "manual",
      plan: "profissional",
      trial_ends_at: null,
      paid_until: null,
      canceled_at: null,
      asaas_customer_id: null,
      asaas_subscription_id: null,
      open_payment: null,
      payments: [],
      synced_at: null,
    };
  const parse = <T,>(v: unknown, fb: T): T => {
    try {
      return v ? (JSON.parse(String(v)) as T) : fb;
    } catch {
      return fb;
    }
  };
  return {
    ...(r as unknown as BillingRow),
    open_payment: parse(r.open_payment, null),
    payments: parse(r.payments, []),
  };
}

export function planOf(storeId: number): PlanId {
  const p = getBilling(storeId).plan;
  return isPlanId(p) ? p : "profissional";
}

function toSummary(p: AsaasPayment): PaymentSummary {
  return {
    id: p.id,
    value_cents: Math.round(p.value * 100),
    status: p.status,
    due_date: p.dueDate,
    paid_date: p.clientPaymentDate || p.paymentDate || null,
    invoice_url: p.invoiceUrl,
  };
}

/**
 * Atualiza a situação da assinatura consultando o Asaas. Os valores são sempre
 * recalculados a partir dos pagamentos (nada é somado duas vezes).
 */
export async function syncBilling(storeId: number): Promise<BillingRow> {
  const b = getBilling(storeId);
  if (b.mode !== "asaas" || !b.asaas_subscription_id || !asaasConfigured()) return b;
  const { data } = await asaas.subscriptionPayments(b.asaas_subscription_id);
  const payments = data.filter((p) => !p.deleted).sort((a, c) => (a.dueDate < c.dueDate ? 1 : -1));
  const paidUntil = maxYmd(b.paid_until, ...payments.filter((p) => PAID_STATUSES.has(p.status)).map((p) => addMonths(p.dueDate, 1)));
  const open = payments.filter((p) => OPEN_STATUSES.has(p.status)).sort((a, c) => (a.dueDate < c.dueDate ? -1 : 1))[0];
  db()
    .prepare(
      `UPDATE store_billing SET paid_until = ?, open_payment = ?, payments = ?, synced_at = ?,
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE store_id = ?`,
    )
    .run(paidUntil, open ? JSON.stringify(toSummary(open)) : null, JSON.stringify(payments.slice(0, 12).map(toSummary)), new Date().toISOString(), storeId);
  return getBilling(storeId);
}

/** Sincroniza se os dados estiverem mais velhos que `maxAgeMs` (erros do Asaas não derrubam a página). */
export async function refreshBilling(storeId: number, maxAgeMs: number): Promise<BillingRow> {
  const b = getBilling(storeId);
  if (b.mode !== "asaas" || !b.asaas_subscription_id) return b;
  const age = b.synced_at ? Date.now() - new Date(b.synced_at).getTime() : Infinity;
  if (age < maxAgeMs) return b;
  try {
    return await syncBilling(storeId);
  } catch (e) {
    console.error("[assinatura] falha ao sincronizar loja", storeId, e);
    db().prepare("UPDATE store_billing SET synced_at = ? WHERE store_id = ?").run(new Date().toISOString(), storeId);
    return getBilling(storeId);
  }
}

/** A loja pode receber pedidos e usar o painel? */
export async function storeIsOperational(storeId: number): Promise<boolean> {
  let b = getBilling(storeId);
  if (billingState(b).ok) return true;
  // pode ter sido paga agora: confere no Asaas (no máximo a cada 10 minutos)
  b = await refreshBilling(storeId, 10 * 60_000);
  return billingState(b).ok;
}

// ---------------- cadastro automático ----------------

export type SignupInput = {
  plan: PlanId;
  store_name: string;
  slug: string;
  whatsapp: string;
  owner_name: string;
  cpf_cnpj: string;
  email: string;
  password: string;
};

export async function signupStore(input: SignupInput): Promise<{ storeId: number; slug: string }> {
  if (!asaasConfigured()) throw new HttpError(503, "O cadastro automático ainda não está disponível. Fale com a gente pelo WhatsApp.");
  const plan = PLANS[input.plan];
  const slug = checkAvailability(input.slug || input.store_name, input.email);
  const trialEnds = addDays(todayYmd(), TRIAL_DAYS);

  const customer = await asaas.createCustomer({
    name: input.owner_name,
    email: input.email,
    cpfCnpj: input.cpf_cnpj,
    mobilePhone: input.whatsapp,
    externalReference: `loja:${slug}`,
  });
  const subscription = await asaas.createSubscription({
    customer: customer.id,
    value: plan.price_cents / 100,
    nextDueDate: trialEnds,
    description: `Cardápio online — plano ${plan.name} (${input.store_name})`,
    externalReference: `loja:${slug}`,
  });
  try {
    const created = createStoreWithOwner({
      name: input.store_name,
      slug,
      owner_name: input.owner_name,
      owner_email: input.email,
      owner_password: input.password,
      whatsapp: input.whatsapp,
      template: "blank",
      billing: {
        mode: "asaas",
        plan: plan.id,
        trial_ends_at: trialEnds,
        asaas_customer_id: customer.id,
        asaas_subscription_id: subscription.id,
      },
    });
    await refreshBilling(created.storeId, 0);
    return created;
  } catch (e) {
    // não deixa cobrança órfã se a loja não pôde ser criada
    await asaas.deleteSubscription(subscription.id).catch(() => {});
    throw e;
  }
}

// ---------------- ações do dono da loja ----------------

export async function changePlan(storeId: number, plan: PlanId) {
  const b = getBilling(storeId);
  const max = PLANS[plan].max_products;
  if (max !== null) {
    const { n } = db().prepare("SELECT COUNT(*) AS n FROM products WHERE store_id = ?").get(storeId) as { n: number };
    if (n > max) throw new HttpError(409, `O plano ${PLANS[plan].name} permite até ${max} produtos e sua loja tem ${n}. Exclua alguns antes de mudar.`);
  }
  if (b.mode === "asaas" && b.asaas_subscription_id && !b.canceled_at) {
    await asaas.updateSubscription(b.asaas_subscription_id, {
      value: PLANS[plan].price_cents / 100,
      description: `Cardápio online — plano ${PLANS[plan].name}`,
      updatePendingPayments: true,
    });
  }
  upsertBilling(storeId, { plan });
  return refreshBilling(storeId, 0);
}

export async function cancelSubscription(storeId: number) {
  const b = getBilling(storeId);
  if (b.mode !== "asaas" || !b.asaas_subscription_id || b.canceled_at) throw new HttpError(400, "Não há assinatura ativa para cancelar.");
  await asaas.deleteSubscription(b.asaas_subscription_id);
  upsertBilling(storeId, { canceled_at: new Date().toISOString(), open_payment: null });
  return getBilling(storeId);
}

export async function reactivateSubscription(storeId: number, storeName: string) {
  const b = getBilling(storeId);
  if (b.mode !== "asaas" || !b.asaas_customer_id) throw new HttpError(400, "Assinatura não encontrada.");
  if (!b.canceled_at) throw new HttpError(400, "A assinatura já está ativa.");
  const plan = PLANS[isPlanId(b.plan) ? b.plan : "profissional"];
  const today = todayYmd();
  const nextDue = b.paid_until && b.paid_until > today ? b.paid_until : today;
  const sub = await asaas.createSubscription({
    customer: b.asaas_customer_id,
    value: plan.price_cents / 100,
    nextDueDate: nextDue,
    description: `Cardápio online — plano ${plan.name} (${storeName})`,
    externalReference: `loja-id:${storeId}`,
  });
  upsertBilling(storeId, { asaas_subscription_id: sub.id, canceled_at: null });
  return refreshBilling(storeId, 0);
}

// ---------------- ações do administrador da plataforma ----------------

/** Passa a loja para cobrança manual (cancela a assinatura no Asaas, se houver). */
export async function setManualBilling(storeId: number) {
  const b = getBilling(storeId);
  if (b.mode === "asaas" && b.asaas_subscription_id && !b.canceled_at) {
    await asaas.deleteSubscription(b.asaas_subscription_id).catch((e) => console.error("[assinatura] cancelar", e));
  }
  upsertBilling(storeId, { mode: "manual", canceled_at: b.mode === "asaas" ? new Date().toISOString() : b.canceled_at, open_payment: null });
}

export function setPlan(storeId: number, plan: PlanId) {
  upsertBilling(storeId, { plan });
}

function upsertBilling(storeId: number, patch: Partial<Record<string, string | null>>) {
  const d = db();
  d.prepare("INSERT OR IGNORE INTO store_billing (store_id) VALUES (?)").run(storeId);
  const keys = Object.keys(patch).filter((k) =>
    ["mode", "plan", "trial_ends_at", "paid_until", "asaas_customer_id", "asaas_subscription_id", "canceled_at", "open_payment"].includes(k),
  );
  if (!keys.length) return;
  d.prepare(
    `UPDATE store_billing SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE store_id = ?`,
  ).run(...keys.map((k) => patch[k] ?? null), storeId);
}

// ---------------- avisos do Asaas (webhook) ----------------

/** O conteúdo do aviso não é confiável: só usamos o ID da assinatura e consultamos o Asaas. */
export async function handleAsaasEvent(body: { event?: string; payment?: { subscription?: string } }) {
  const subId = body.payment?.subscription;
  if (!subId) return;
  const row = db().prepare("SELECT store_id FROM store_billing WHERE asaas_subscription_id = ?").get(subId) as { store_id: number } | undefined;
  if (row) await syncBilling(row.store_id);
}
