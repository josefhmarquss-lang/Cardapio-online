"use client";

import { ExternalLink, KeyRound, Loader2, LogOut, Plus, Power, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { BRAND } from "@/lib/brand";
import { billingState, formatYmd } from "@/lib/billing-state";
import { PLANS, type PlanId } from "@/lib/plans";
import { slugifyClient } from "./slug";
import { api } from "./api";
import { SuperAdmins, MyPassword } from "./SuperAdmins";
import { PageHeader, Section, ToastProvider, useToast } from "./ui";

type Row = {
  id: number;
  slug: string;
  name: string;
  is_active: number;
  created_at: string;
  logo_url: string | null;
  primary_color: string;
  owner_email: string | null;
  products: number;
  orders: number;
  billing_mode: "manual" | "asaas";
  plan: string;
  trial_ends_at: string | null;
  paid_until: string | null;
  canceled_at: string | null;
};

function BillingBadge({ r }: { r: Row }) {
  const st = billingState({ mode: r.billing_mode, plan: r.plan, trial_ends_at: r.trial_ends_at, paid_until: r.paid_until, canceled_at: r.canceled_at });
  const map: Record<string, [string, string]> = {
    manual: ["Cobrança manual", "bg-stone-100 text-stone-600"],
    trial: [`Teste até ${"until" in st && st.until ? formatYmd(st.until) : ""}`, "bg-sky-100 text-sky-800"],
    active: [`Em dia até ${"until" in st && st.until ? formatYmd(st.until) : ""}`, "bg-emerald-100 text-emerald-800"],
    grace: ["Em atraso", "bg-amber-100 text-amber-800"],
    locked: ["Pausada (sem pagamento)", "bg-red-100 text-red-800"],
  };
  const [label, cls] = map[st.kind];
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
      {r.billing_mode === "asaas" && r.canceled_at ? " · cancelada" : ""}
    </span>
  );
}

type AdminRow = { id: number; email: string; name: string; created_at: string };

export function SuperDashboard(props: { email: string; myId: number; initial: Row[]; admins: AdminRow[] }) {
  return (
    <ToastProvider>
      <Inner {...props} />
    </ToastProvider>
  );
}

function Inner({ email, myId, initial, admins }: { email: string; myId: number; initial: Row[]; admins: AdminRow[] }) {
  const [rows, setRows] = useState(initial);
  const [form, setForm] = useState({ name: "", slug: "", owner_name: "", owner_email: "", owner_password: "", whatsapp: "", template: "blank" as "blank" | "pizzaria", plan: "profissional" as PlanId });
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function reload() {
    const { stores } = await api<{ stores: Row[] }>("/api/super/stores");
    setRows(stores);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ slug: string }>("/api/super/stores", "POST", form);
      toast("ok", `Loja criada: /${r.slug}`);
      setForm({ name: "", slug: "", owner_name: "", owner_email: "", owner_password: "", whatsapp: "", template: "blank", plan: "profissional" });
      setSlugTouched(false);
      await reload();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Erro.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(r: Row) {
    if (!window.confirm(r.is_active ? `Desativar "${r.name}"? O cardápio sai do ar e o dono perde o acesso.` : `Reativar "${r.name}"?`)) return;
    try {
      await api(`/api/super/stores/${r.id}`, "PATCH", { is_active: !r.is_active });
      await reload();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Erro.");
    }
  }

  async function changePlan(r: Row, plan: PlanId) {
    if (!window.confirm(`Mudar "${r.name}" para o plano ${PLANS[plan].name}?${r.billing_mode === "asaas" ? " A mensalidade no Asaas também será ajustada." : ""}`)) return;
    try {
      await api(`/api/super/stores/${r.id}`, "PATCH", { plan });
      toast("ok", "Plano alterado.");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Erro.");
    }
    await reload();
  }

  async function makeManual(r: Row) {
    if (!window.confirm(`Passar "${r.name}" para cobrança manual? A assinatura no Asaas será cancelada e a loja não será mais pausada automaticamente.`)) return;
    try {
      await api(`/api/super/stores/${r.id}`, "PATCH", { billing_mode: "manual" });
      toast("ok", "Loja em cobrança manual.");
      await reload();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Erro.");
    }
  }

  async function removeStore(r: Row) {
    const typed = window.prompt(
      `Excluir DEFINITIVAMENTE "${r.name}"?\n\nApaga a conta do dono, produtos, fotos, pedidos e a assinatura. Não dá para desfazer.\n\nPara confirmar, digite o endereço da loja: ${r.slug}`,
    );
    if (typed === null) return;
    if (typed.trim() !== r.slug) return toast("error", "O endereço digitado não confere. Nada foi excluído.");
    try {
      await api(`/api/super/stores/${r.id}`, "DELETE");
      toast("ok", "Loja excluída.");
      await reload();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Erro.");
    }
  }

  async function resetPassword(r: Row) {
    const pwd = window.prompt(`Nova senha para ${r.owner_email} (mín. 8 caracteres):`);
    if (!pwd) return;
    try {
      await api(`/api/super/stores/${r.id}`, "PATCH", { new_password: pwd });
      toast("ok", "Senha redefinida. Envie a nova senha ao cliente.");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Erro.");
    }
  }

  const input = (k: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label">{label}</label>
      <input
        {...props}
        className="field"
        value={form[k]}
        onChange={(e) => {
          const val = e.target.value;
          if (k === "slug") setSlugTouched(true);
          setForm((f) => ({ ...f, [k]: val, ...(k === "name" && !slugTouched ? { slug: slugifyClient(val) } : {}) }));
        }}
      />
    </div>
  );

  return (
    <div className="min-h-dvh bg-stone-100/70">
      <header className="bg-stone-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5 font-extrabold">
            <span className="grid size-8 place-items-center rounded-lg bg-orange-600 text-xs">{BRAND.short}</span>
            {BRAND.name} <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold">Plataforma</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-stone-400 sm:inline">{email}</span>
            <button
              className="btn text-stone-300 hover:bg-white/10"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/admin/login";
              }}
            >
              <LogOut className="size-4" /> Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <PageHeader title="Estabelecimentos" description="Cadastre clientes e entregue o acesso ao painel de cada loja." />
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="card overflow-hidden">
            {rows.length === 0 ? (
              <p className="p-8 text-center text-sm text-stone-500">Nenhuma loja cadastrada.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {rows.map((r) => (
                  <li key={r.id} className={`flex flex-wrap items-center gap-3 px-5 py-4 ${r.is_active ? "" : "bg-stone-50 opacity-70"}`}>
                    {r.logo_url ? (
                       
                      <img src={r.logo_url} alt="" className="size-11 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-11 place-items-center rounded-full font-bold text-white" style={{ background: r.primary_color }}>
                        {r.name[0]}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {r.name} {!r.is_active && <span className="ml-1 rounded bg-stone-300 px-1.5 py-0.5 text-[11px]">desativada</span>}
                      </p>
                      <p className="truncate text-xs text-stone-500">
                        /{r.slug} · {r.owner_email} · {r.products} produtos · {r.orders} pedidos
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <BillingBadge r={r} />
                        <select
                          className="rounded border border-stone-200 bg-white px-1 py-0.5 text-[11px] font-semibold"
                          value={r.plan}
                          onChange={(e) => changePlan(r, e.target.value as PlanId)}
                          aria-label="Plano"
                        >
                          {(Object.keys(PLANS) as PlanId[]).map((id) => (
                            <option key={id} value={id}>
                              {PLANS[id].name}
                            </option>
                          ))}
                        </select>
                        {r.billing_mode === "asaas" && (
                          <button className="text-[11px] font-semibold text-stone-500 underline" onClick={() => makeManual(r)}>
                            passar para cobrança manual
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <a href={`/${r.slug}`} target="_blank" className="btn-ghost px-2.5" title="Abrir cardápio">
                        <ExternalLink className="size-4" />
                      </a>
                      <button className="btn-ghost px-2.5" onClick={() => resetPassword(r)} title="Redefinir senha do dono">
                        <KeyRound className="size-4" />
                      </button>
                      <button className={`btn-ghost px-2.5 ${r.is_active ? "text-red-600" : "text-emerald-600"}`} onClick={() => toggle(r)} title={r.is_active ? "Desativar" : "Reativar"}>
                        <Power className="size-4" />
                      </button>
                      {!r.is_active && (
                        <button className="btn-ghost px-2.5 text-red-700 hover:bg-red-50" onClick={() => removeStore(r)} title="Excluir definitivamente">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-6">
          <Section title="Nova loja" description="Cria o cardápio e o login do dono.">
            <form onSubmit={create} className="space-y-3">
              {input("name", "Nome do estabelecimento", { required: true, maxLength: 80, placeholder: "Ex.: Lanchonete do Zé" })}
              <div>
                <label className="label">Endereço do cardápio</label>
                <div className="flex items-center rounded-xl border border-stone-300 bg-white pl-3 text-sm text-stone-400 shadow-sm focus-within:border-orange-500">
                  /
                  <input
                    className="w-full bg-transparent px-1 py-2.5 text-[15px] text-stone-900 outline-none"
                    value={form.slug}
                    maxLength={48}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((f) => ({ ...f, slug: slugifyClient(e.target.value, true) }));
                    }}
                  />
                </div>
              </div>
              {input("whatsapp", "WhatsApp da loja", { maxLength: 20, placeholder: "(11) 99999-9999" })}
              <hr className="border-stone-100" />
              {input("owner_name", "Nome do responsável", { maxLength: 80 })}
              {input("owner_email", "E-mail de acesso", { type: "email", required: true, maxLength: 160 })}
              {input("owner_password", "Senha inicial", { type: "text", required: true, minLength: 8, maxLength: 128, placeholder: "mín. 8 caracteres" })}
              <div>
                <label className="label">Começar com</label>
                <select className="field" value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value as "blank" | "pizzaria" })}>
                  <option value="blank">Cardápio em branco</option>
                  <option value="pizzaria">Modelo de pizzaria (produtos de exemplo)</option>
                </select>
              </div>
              <div>
                <label className="label">Plano</label>
                <select className="field" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as PlanId })}>
                  {(Object.keys(PLANS) as PlanId[]).map((id) => (
                    <option key={id} value={id}>
                      {PLANS[id].name}
                    </option>
                  ))}
                </select>
                <p className="hint">Lojas cadastradas aqui ficam em cobrança manual: você recebe do cliente por fora.</p>
              </div>
              <button className="btn-primary w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Cadastrar loja
              </button>
              <p className="flex items-start gap-1.5 text-xs text-stone-500">
                <Store className="mt-0.5 size-3.5 shrink-0" /> Envie ao cliente o link do painel (/admin/login), o e-mail e a senha. Ele pode trocar a senha em “Minha conta”.
              </p>
            </form>
          </Section>
          <SuperAdmins initial={admins} myId={myId} />
          <MyPassword />
          </div>
        </div>
      </main>
    </div>
  );
}
