"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export type OnboardingSteps = { logo: boolean; info: boolean; products: boolean; payment: boolean; slug: string };

/** Primeiros passos para quem acabou de criar a loja. Some quando tudo estiver pronto. */
export function Onboarding({ steps }: { steps: OnboardingSteps }) {
  const [url, setUrl] = useState(`/${steps.slug}`);
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(`${window.location.origin}/${steps.slug}`), [steps.slug]);

  const items = [
    { done: steps.logo, href: "/admin/aparencia", title: "Coloque o logo, o banner e as cores" },
    { done: steps.info, href: "/admin/loja", title: "Confira WhatsApp, endereço e horários" },
    { done: steps.products, href: "/admin/produtos", title: "Cadastre as categorias e os produtos" },
    { done: steps.payment, href: "/admin/pagamento", title: "Configure o Pix e a entrega" },
  ];
  const left = items.filter((i) => !i.done).length;

  return (
    <section className="card mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-4 text-white">
        <p className="text-lg font-extrabold">Bem-vindo! Monte o seu cardápio 🍕</p>
        <p className="text-sm text-orange-100">{left === 0 ? "Tudo pronto — agora é só divulgar!" : `Faltam ${left} passo${left > 1 ? "s" : ""}.`}</p>
      </div>
      <ol className="divide-y divide-stone-100">
        {items.map((it, i) => (
          <li key={it.href}>
            <Link href={it.href} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${it.done ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-500"}`}>
                {it.done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={`flex-1 text-sm font-semibold ${it.done ? "text-stone-400 line-through" : "text-stone-800"}`}>{it.title}</span>
              {!it.done && <span className="text-sm font-semibold text-orange-700">Fazer →</span>}
            </Link>
          </li>
        ))}
        <li className="flex flex-wrap items-center gap-3 px-5 py-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stone-100 text-sm font-bold text-stone-500">5</span>
          <span className="flex-1 text-sm font-semibold text-stone-800">
            Divulgue o seu link: <span className="font-mono text-orange-700">{url}</span>
          </span>
          <button
            className="btn-outline py-1.5 text-sm"
            onClick={() => {
              navigator.clipboard?.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copiado" : "Copiar link"}
          </button>
        </li>
      </ol>
    </section>
  );
}
