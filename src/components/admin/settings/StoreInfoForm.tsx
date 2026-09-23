"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { DAY_NAMES } from "@/lib/hours";
import type { DayHours, OpenMode, Store } from "@/lib/types";
import { PageHeader, SaveBar, Section, Toggle, useToast } from "../ui";
import { useStoreForm } from "./useStoreForm";

const FIELDS = [
  "name",
  "tagline",
  "about",
  "whatsapp",
  "phone",
  "instagram",
  "address_street",
  "address_number",
  "address_complement",
  "address_neighborhood",
  "address_city",
  "address_state",
  "address_zip",
  "opening_hours",
  "open_mode",
] as const;

const WEEK = [1, 2, 3, 4, 5, 6, 0];

export function StoreInfoForm({ store }: { store: Store }) {
  const f = useStoreForm(store, FIELDS);
  const v = f.values;
  const toast = useToast();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/${store.slug}`;

  const text = (k: (typeof FIELDS)[number], label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={props.className}>
      <label className="label">{label}</label>
      <input {...props} className="field" value={v[k] as string} onChange={(e) => f.set(k, e.target.value as never)} />
    </div>
  );

  const hours: DayHours[] = WEEK.map((d) => v.opening_hours.find((h) => h.day === d) ?? { day: d, open: "18:00", close: "23:00", closed: true });
  const setDay = (d: number, patch: Partial<DayHours>) =>
    f.set(
      "opening_hours",
      hours.map((h) => (h.day === d ? { ...h, ...patch } : h)),
    );

  return (
    <div>
      <PageHeader title="Loja e horários" description="Informações exibidas no cardápio e usadas nos pedidos." />
      <div className="space-y-6">
        <Section title="Link do seu cardápio" description="Compartilhe no Instagram, WhatsApp e Google.">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="field font-mono text-sm" readOnly value={url} />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  navigator.clipboard?.writeText(url);
                  toast("ok", "Link copiado!");
                }}
              >
                <Copy className="size-4" /> Copiar
              </button>
              <a className="btn-outline" href={`/${store.slug}`} target="_blank">
                Abrir <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        </Section>

        <Section title="Informações da loja">
          <div className="grid gap-4 sm:grid-cols-2">
            {text("name", "Nome do estabelecimento", { maxLength: 80, className: "sm:col-span-2" })}
            {text("tagline", "Frase de destaque", { maxLength: 140, placeholder: "Ex.: Pizzaria artesanal no forno a lenha", className: "sm:col-span-2" })}
            <div className="sm:col-span-2">
              <label className="label">Sobre a loja</label>
              <textarea className="field resize-none" rows={3} maxLength={1000} value={v.about} onChange={(e) => f.set("about", e.target.value)} />
            </div>
          </div>
        </Section>

        <Section title="Contato" description="O WhatsApp recebe as mensagens de pedido dos clientes.">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">WhatsApp para pedidos</label>
              <input className="field" inputMode="tel" placeholder="(11) 99999-9999" maxLength={20} value={v.whatsapp} onChange={(e) => f.set("whatsapp", e.target.value)} />
              <p className="hint">Com DDD. Ex.: (11) 98765-4321</p>
            </div>
            {text("phone", "Telefone fixo (opcional)", { maxLength: 30, placeholder: "(11) 3333-3333" })}
            {text("instagram", "Instagram (opcional)", { maxLength: 60, placeholder: "@sualoja" })}
          </div>
        </Section>

        <Section title="Endereço">
          <div className="grid gap-4 sm:grid-cols-6">
            {text("address_street", "Rua / avenida", { className: "sm:col-span-4", maxLength: 120 })}
            {text("address_number", "Número", { className: "sm:col-span-2", maxLength: 20 })}
            {text("address_complement", "Complemento", { className: "sm:col-span-3", maxLength: 80 })}
            {text("address_neighborhood", "Bairro", { className: "sm:col-span-3", maxLength: 80 })}
            {text("address_city", "Cidade", { className: "sm:col-span-3", maxLength: 80 })}
            {text("address_state", "Estado (UF)", { className: "sm:col-span-1", maxLength: 30, placeholder: "SP" })}
            {text("address_zip", "CEP", { className: "sm:col-span-2", maxLength: 12, placeholder: "00000-000" })}
          </div>
        </Section>

        <Section title="Horário de funcionamento" description="Fora do horário, o cardápio continua visível, mas não recebe pedidos.">
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["auto", "Automático", "Abre e fecha pelo horário abaixo"],
                ["open", "Sempre aberto", "Recebe pedidos a qualquer hora"],
                ["closed", "Fechado agora", "Pausa temporária dos pedidos"],
              ] as [OpenMode, string, string][]
            ).map(([m, label, desc]) => (
              <button
                key={m}
                type="button"
                onClick={() => f.set("open_mode", m)}
                className={`rounded-xl border-2 p-3 text-left transition ${v.open_mode === m ? "border-orange-500 bg-orange-50" : "border-stone-200"}`}
              >
                <span className="block text-sm font-bold">{label}</span>
                <span className="text-xs text-stone-500">{desc}</span>
              </button>
            ))}
          </div>
          <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
            {hours.map((h) => (
              <div key={h.day} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="w-24 text-sm font-semibold">{DAY_NAMES[h.day]}</span>
                <Toggle checked={!h.closed} onChange={(on) => setDay(h.day, { closed: !on })} />
                {h.closed ? (
                  <span className="text-sm text-stone-400">Fechado</span>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="time" className="field w-32 py-1.5" value={h.open} onChange={(e) => setDay(h.day, { open: e.target.value })} />
                    até
                    <input type="time" className="field w-32 py-1.5" value={h.close} onChange={(e) => setDay(h.day, { close: e.target.value })} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="hint">Se o fechamento for depois da meia-noite (ex.: 18:00 até 01:00), é só informar normalmente.</p>
        </Section>
      </div>
      <SaveBar dirty={f.dirty} saving={f.saving} onSave={() => f.save()} onReset={f.reset} />
    </div>
  );
}
