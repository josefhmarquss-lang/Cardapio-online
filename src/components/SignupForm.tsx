"use client";

import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { slugifyClient } from "@/components/admin/slug";
import { formatCpfCnpj, isValidCpfCnpj } from "@/lib/cpf";
import { money, onlyDigits } from "@/lib/format";
import { PLANS, type PlanId } from "@/lib/plans";

export function SignupForm({ initialPlan, trialDays, firstDue }: { initialPlan: PlanId; trialDays: number; firstDue: string }) {
  const [plan, setPlan] = useState<PlanId>(initialPlan);
  const [f, setF] = useState({ store_name: "", slug: "", whatsapp: "", owner_name: "", cpf_cnpj: "", email: "", password: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.host), []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === "cpf_cnpj") v = formatCpfCnpj(v);
    if (k === "slug") {
      setSlugTouched(true);
      v = slugifyClient(v, true);
    }
    setF((s) => ({ ...s, [k]: v, ...(k === "store_name" && !slugTouched ? { slug: slugifyClient(v) } : {}) }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValidCpfCnpj(f.cpf_cnpj)) return setError("Confira o CPF ou CNPJ.");
    if (onlyDigits(f.whatsapp).length < 10) return setError("Informe o WhatsApp com DDD.");
    if (f.password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    setBusy(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível concluir o cadastro.");
      window.location.href = data.redirect;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexão.");
      setBusy(false);
    }
  }

  const selected = PLANS[plan];

  return (
    <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card space-y-4 p-6">
          <h2 className="font-bold">1. Escolha o plano</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(PLANS) as PlanId[]).map((id) => {
              const p = PLANS[id];
              const on = plan === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlan(id)}
                  className={`rounded-xl border-2 p-4 text-left transition ${on ? "border-orange-500 bg-orange-50" : "border-stone-200 hover:border-stone-300"}`}
                >
                  <span className="flex items-center justify-between font-bold">
                    {p.name} {on && <Check className="size-5 text-orange-600" />}
                  </span>
                  <span className="block text-xl font-extrabold">
                    {money(p.price_cents)}
                    <span className="text-sm font-medium text-stone-500">/mês</span>
                  </span>
                  <span className="text-sm text-stone-500">{p.max_products ? `Até ${p.max_products} produtos` : "Produtos ilimitados"}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-bold">2. Sua loja</h2>
          <div>
            <label className="label">Nome da loja</label>
            <input className="field" required maxLength={80} placeholder="Ex.: Pizzaria do Zé" value={f.store_name} onChange={set("store_name")} />
          </div>
          <div>
            <label className="label">Endereço do cardápio</label>
            <div className="flex items-center rounded-xl border border-stone-300 bg-white pl-3.5 text-[15px] text-stone-400 shadow-sm focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/15">
              <span className="shrink-0">{origin || "seusite"}/</span>
              <input className="w-full bg-transparent py-2.5 pr-3 text-stone-900 outline-none" required maxLength={48} value={f.slug} onChange={set("slug")} />
            </div>
            <p className="hint">É o link que você vai divulgar para os seus clientes.</p>
          </div>
          <div>
            <label className="label">WhatsApp da loja (recebe os pedidos)</label>
            <input className="field" required inputMode="tel" maxLength={20} placeholder="(82) 99999-9999" value={f.whatsapp} onChange={set("whatsapp")} />
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-bold">3. Seus dados de acesso</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nome completo</label>
              <input className="field" required maxLength={80} autoComplete="name" value={f.owner_name} onChange={set("owner_name")} />
            </div>
            <div>
              <label className="label">CPF ou CNPJ</label>
              <input className="field" required inputMode="numeric" maxLength={18} value={f.cpf_cnpj} onChange={set("cpf_cnpj")} />
              <p className="hint">Usado apenas para a cobrança da mensalidade.</p>
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="field" required type="email" maxLength={160} autoComplete="email" value={f.email} onChange={set("email")} />
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  className="field pr-10"
                  required
                  minLength={8}
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="mín. 8 caracteres"
                  value={f.password}
                  onChange={set("password")}
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" aria-label="Mostrar senha">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="card space-y-4 p-6">
          <h2 className="font-bold">Resumo</h2>
          <div className="flex justify-between text-sm">
            <span>Plano {selected.name}</span>
            <span className="font-semibold">{money(selected.price_cents)}/mês</span>
          </div>
          {trialDays > 0 && (
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
              <strong>{trialDays} dias grátis.</strong> A primeira mensalidade vence em {firstDue}. Você recebe o link de pagamento por e-mail e no painel.
            </div>
          )}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
          <button className="btn-primary w-full py-3 text-[15px]" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} Criar meu cardápio
          </button>
          <p className="text-xs text-stone-500">
            Pagamento por Pix, boleto ou cartão, processado pelo Asaas. Sem fidelidade: cancele quando quiser no painel.
          </p>
        </div>
      </aside>
    </form>
  );
}
