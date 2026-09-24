import type { Metadata } from "next";
import { SignupForm } from "@/components/SignupForm";
import { asaasConfigured } from "@/lib/asaas";
import { BRAND } from "@/lib/brand";
import { whatsappNumber } from "@/lib/format";
import { addDays, formatYmd, todayYmd } from "@/lib/billing-state";
import { isPlanId, TRIAL_DAYS } from "@/lib/plans";

export const metadata: Metadata = { title: `Criar meu cardápio — ${BRAND.name}` };
export const dynamic = "force-dynamic";

export default async function SignupPage(props: PageProps<"/assinar">) {
  const sp = await props.searchParams;
  const plano = typeof sp.plano === "string" && isPlanId(sp.plano) ? sp.plano : "profissional";
  const sales = BRAND.salesWhatsapp ? `https://wa.me/${whatsappNumber(BRAND.salesWhatsapp)}` : null;

  return (
    <div className="min-h-dvh bg-stone-50">
      {asaasConfigured() && process.env.ASAAS_ENV !== "production" && (
        <div className="bg-amber-400 px-4 py-2 text-center text-sm font-bold text-amber-950">
          Ambiente de teste (sandbox do Asaas): os pagamentos não são reais.
        </div>
      )}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <a href="/" className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="grid size-9 place-items-center rounded-xl bg-orange-600 text-sm text-white">{BRAND.short}</span>
            {BRAND.name}
          </a>
          <a href="/admin/login" className="text-sm font-semibold text-stone-600 hover:text-stone-900">
            Já tenho conta
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Crie o cardápio da sua loja</h1>
        <p className="mt-2 text-stone-600">
          {TRIAL_DAYS > 0 ? `${TRIAL_DAYS} dias grátis para testar. ` : ""}Depois, mensalidade pelo Pix, boleto ou cartão. Cancele quando quiser.
        </p>
        {asaasConfigured() ? (
          <SignupForm initialPlan={plano} trialDays={TRIAL_DAYS} firstDue={formatYmd(addDays(todayYmd(), TRIAL_DAYS))} />
        ) : (
          <div className="card mt-8 max-w-xl p-6">
            <p className="font-semibold">O cadastro online ainda não está disponível.</p>
            <p className="mt-1 text-sm text-stone-600">Fale com a gente que criamos o seu cardápio rapidinho.</p>
            {sales && (
              <a href={sales} className="btn-primary mt-4">
                Falar pelo WhatsApp
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
