"use client";

import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Loader2, Lock, RefreshCw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BRAND } from "@/lib/brand";
import { formatYmd, type BillingState } from "@/lib/billing-state";
import { money, whatsappNumber } from "@/lib/format";
import { isPlanId, PLANS, type PlanId } from "@/lib/plans";
import { api } from "./api";
import { PageHeader, Section, useToast } from "./ui";

type Payment = { id: string; value_cents: number; status: string; due_date: string; paid_date: string | null; invoice_url: string };
type Billing = {
  mode: "manual" | "asaas";
  plan: string;
  trial_ends_at: string | null;
  paid_until: string | null;
  canceled_at: string | null;
  open_payment: Payment | null;
  payments: Payment[];
};

const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  RECEIVED: { label: "Pago", cls: "bg-emerald-100 text-emerald-800" },
  CONFIRMED: { label: "Pago", cls: "bg-emerald-100 text-emerald-800" },
  RECEIVED_IN_CASH: { label: "Pago", cls: "bg-emerald-100 text-emerald-800" },
  PENDING: { label: "Em aberto", cls: "bg-sky-100 text-sky-800" },
  OVERDUE: { label: "Vencida", cls: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Estornada", cls: "bg-stone-200 text-stone-700" },
};

export function BillingPanel({ initial, initialState, productCount }: { initial: Billing; initialState: BillingState; productCount: number }) {
  const [b, setB] = useState(initial);
  const [state, setState] = useState(initialState);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const plan = PLANS[isPlanId(b.plan) ? b.plan : "profissional"];

  async function run(key: string, fn: () => Promise<{ billing: Billing; state: BillingState }>, ok?: string) {
    setBusy(key);
    try {
      const r = await fn();
      setB(r.billing);
      setState(r.state);
      if (ok) toast("ok", ok);
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Erro.");
    } finally {
      setBusy(null);
    }
  }

  if (b.mode === "manual") {
    const sales = BRAND.salesWhatsapp ? `https://wa.me/${whatsappNumber(BRAND.salesWhatsapp)}` : null;
    return (
      <div className="max-w-2xl">
        <PageHeader title="Assinatura" />
        <Section title={`Plano ${plan.name}`}>
          <p className="text-sm text-stone-600">
            Sua assinatura é acompanhada diretamente com a nossa equipe. Para mudar de plano ou tirar dúvidas sobre pagamento, fale com a gente.
          </p>
          {sales && (
            <a href={sales} target="_blank" rel="noopener noreferrer" className="btn-outline">
              Falar com o suporte
            </a>
          )}
        </Section>
      </div>
    );
  }

  const open = b.open_payment;
  const statusBox = (() => {
    if (state.kind === "trial")
      return { icon: Clock, tone: "border-sky-200 bg-sky-50 text-sky-900", title: `Teste grátis até ${formatYmd(state.until)}`, text: b.canceled_at ? "Assinatura cancelada: o acesso termina nessa data." : "Aproveite para montar o seu cardápio." };
    if (state.kind === "active")
      return { icon: CheckCircle2, tone: "border-emerald-200 bg-emerald-50 text-emerald-900", title: `Assinatura em dia — paga até ${formatYmd(state.until)}`, text: b.canceled_at ? "Assinatura cancelada: o acesso termina nessa data." : "Obrigado! Tudo certo com a sua mensalidade." };
    if (state.kind === "grace")
      return { icon: AlertTriangle, tone: "border-amber-200 bg-amber-50 text-amber-900", title: "Mensalidade em atraso", text: `Pague até ${formatYmd(state.lockOn)} para o seu cardápio não ser pausado.` };
    return { icon: Lock, tone: "border-red-200 bg-red-50 text-red-900", title: "Cardápio pausado", text: "Pague a mensalidade em aberto para voltar a funcionar. Seus dados continuam salvos." };
  })();

  return (
    <div className="max-w-3xl">
      <PageHeader title="Assinatura" description="Plano, mensalidades e forma de pagamento.">
        <button className="btn-outline" disabled={!!busy} onClick={() => run("sync", () => api("/api/admin/billing?atualizar=1"), "Situação atualizada.")}>
          <RefreshCw className={`size-4 ${busy === "sync" ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </PageHeader>

      <div className="space-y-6">
        <div className={`flex gap-3 rounded-2xl border p-5 ${statusBox.tone}`}>
          <statusBox.icon className="mt-0.5 size-6 shrink-0" />
          <div>
            <p className="text-lg font-extrabold">{statusBox.title}</p>
            <p className="text-sm opacity-90">{statusBox.text}</p>
            <p className="mt-1 text-sm">
              Plano <strong>{plan.name}</strong> — {money(plan.price_cents)}/mês
            </p>
          </div>
        </div>

        {!b.canceled_at && (
          <Section title="Mensalidade" description="Pague por Pix, boleto ou cartão na página segura do Asaas.">
            {open ? (
              <div className="flex flex-col gap-4 rounded-xl border border-stone-200 p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="text-2xl font-extrabold tabular-nums">{money(open.value_cents)}</p>
                  <p className="text-sm text-stone-600">
                    Vencimento: <strong>{formatYmd(open.due_date)}</strong>{" "}
                    <span className={`ml-1 rounded px-1.5 py-0.5 text-xs font-bold ${PAYMENT_STATUS[open.status]?.cls ?? "bg-stone-100"}`}>
                      {PAYMENT_STATUS[open.status]?.label ?? open.status}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:w-60">
                  <a href={open.invoice_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                    Pagar agora <ExternalLink className="size-4" />
                  </a>
                  <button className="btn-ghost text-sm" disabled={!!busy} onClick={() => run("sync", () => api("/api/admin/billing?atualizar=1"), "Situação atualizada.")}>
                    {busy === "sync" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Já paguei — atualizar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-600">Nenhuma mensalidade em aberto no momento. A próxima aparece aqui assim que for gerada.</p>
            )}
            <p className="text-xs text-stone-500">Pix é confirmado em poucos minutos; boleto, em até 3 dias úteis. Você também recebe os avisos de cobrança por e-mail.</p>
          </Section>
        )}

        <Section title="Plano" description="A mudança vale a partir da próxima mensalidade.">
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(PLANS) as PlanId[]).map((id) => {
              const p = PLANS[id];
              const current = id === plan.id;
              const tooMany = p.max_products !== null && productCount > p.max_products;
              return (
                <div key={id} className={`rounded-xl border-2 p-4 ${current ? "border-orange-500 bg-orange-50" : "border-stone-200"}`}>
                  <p className="font-bold">{p.name}</p>
                  <p className="text-xl font-extrabold">{money(p.price_cents)}<span className="text-sm font-medium text-stone-500">/mês</span></p>
                  <p className="text-sm text-stone-500">{p.max_products ? `Até ${p.max_products} produtos` : "Produtos ilimitados"}</p>
                  {current ? (
                    <p className="mt-3 text-sm font-bold text-orange-700">Seu plano atual</p>
                  ) : (
                    <button
                      className="btn-outline mt-3 w-full"
                      disabled={!!busy || !!b.canceled_at || tooMany}
                      title={tooMany ? `Sua loja tem ${productCount} produtos` : undefined}
                      onClick={() => {
                        if (!window.confirm(`Mudar para o plano ${p.name} (${money(p.price_cents)}/mês)?`)) return;
                        run("plan", () => api("/api/admin/billing/plan", "POST", { plan: id }), `Plano alterado para ${p.name}.`);
                      }}
                    >
                      {busy === "plan" && <Loader2 className="size-4 animate-spin" />} Mudar para {p.name}
                    </button>
                  )}
                  {!current && tooMany && <p className="mt-1 text-xs text-stone-500">Sua loja tem {productCount} produtos.</p>}
                </div>
              );
            })}
          </div>
        </Section>

        {b.payments.length > 0 && (
          <Section title="Histórico">
            <ul className="divide-y divide-stone-100 text-sm">
              {b.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span>
                    Vencimento {formatYmd(p.due_date)}
                    {p.paid_date && <span className="text-stone-500"> · pago em {formatYmd(p.paid_date)}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{money(p.value_cents)}</span>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${PAYMENT_STATUS[p.status]?.cls ?? "bg-stone-100 text-stone-700"}`}>
                      {PAYMENT_STATUS[p.status]?.label ?? p.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <div className="text-sm">
          {b.canceled_at ? (
            <button className="btn-primary" disabled={!!busy} onClick={() => run("reactivate", () => api("/api/admin/billing/reactivate", "POST"), "Assinatura reativada.")}>
              {busy === "reactivate" && <Loader2 className="size-4 animate-spin" />} Reativar assinatura
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-1.5 text-stone-500 underline underline-offset-2 hover:text-red-600"
              disabled={!!busy}
              onClick={() => {
                if (!window.confirm("Cancelar a assinatura? Você continua com acesso até o fim do período já pago (ou do teste grátis).")) return;
                run("cancel", () => api("/api/admin/billing/cancel", "POST"), "Assinatura cancelada.");
              }}
            >
              <XCircle className="size-4" /> Cancelar assinatura
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
