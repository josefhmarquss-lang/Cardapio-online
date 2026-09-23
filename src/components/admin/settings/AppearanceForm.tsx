"use client";

import { ExternalLink } from "lucide-react";
import { readableOn } from "@/lib/colors";
import type { FontStyle, Store } from "@/lib/types";
import { ImageInput, PageHeader, SaveBar, Section } from "../ui";
import { useStoreForm } from "./useStoreForm";

const FIELDS = ["logo_url", "banner_url", "primary_color", "accent_color", "background_color", "font_style"] as const;

const PALETTES = [
  { name: "Forno a lenha", primary: "#B7291C", accent: "#F2B138", bg: "#FBF6EE" },
  { name: "Verde italiano", primary: "#1F7A4D", accent: "#E4B43C", bg: "#F6F7F1" },
  { name: "Burger noturno", primary: "#F59E0B", accent: "#EF4444", bg: "#161412" },
  { name: "Açaí", primary: "#6D28D9", accent: "#F472B6", bg: "#FAF7FF" },
  { name: "Oceano", primary: "#0E7490", accent: "#F97316", bg: "#F3F9FB" },
  { name: "Grafite", primary: "#27272A", accent: "#F43F5E", bg: "#FAFAFA" },
];

const FONTS: { value: FontStyle; label: string; cls: string }[] = [
  { value: "modern", label: "Moderna", cls: "font-store-modern" },
  { value: "classic", label: "Clássica", cls: "font-store-classic" },
  { value: "rustic", label: "Marcante", cls: "font-store-rustic" },
];

export function AppearanceForm({ store }: { store: Store }) {
  const f = useStoreForm(store, FIELDS);
  const v = f.values;

  return (
    <div>
      <PageHeader title="Aparência" description="Logo, banner, cores e estilo do seu cardápio.">
        <a href={`/${store.slug}`} target="_blank" className="btn-outline">
          Ver cardápio <ExternalLink className="size-4" />
        </a>
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Section title="Logotipo" description="Aparece no topo do cardápio. Prefira imagem quadrada.">
            <ImageInput value={v.logo_url} onChange={(u) => f.set("logo_url", u)} aspect="round" maxSide={600} />
          </Section>
          <Section title="Banner de destaque" description="Imagem larga de capa (recomendado 1600 × 600 px).">
            <ImageInput value={v.banner_url} onChange={(u) => f.set("banner_url", u)} aspect="wide" maxSide={2000} />
          </Section>
          <Section title="Cores" description="Escolha uma combinação pronta ou personalize.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PALETTES.map((p) => {
                const on = v.primary_color === p.primary && v.accent_color === p.accent && v.background_color === p.bg;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      f.set("primary_color", p.primary);
                      f.set("accent_color", p.accent);
                      f.set("background_color", p.bg);
                    }}
                    className={`flex items-center gap-3 rounded-xl border-2 p-2.5 text-left text-sm font-semibold transition ${on ? "border-orange-500 bg-orange-50" : "border-stone-200 hover:border-stone-300"}`}
                  >
                    <span className="flex -space-x-1.5">
                      {[p.primary, p.accent, p.bg].map((c) => (
                        <span key={c} className="size-6 rounded-full ring-2 ring-white" style={{ background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.1)" }} />
                      ))}
                    </span>
                    {p.name}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-4 pt-2 sm:grid-cols-3">
              <ColorField label="Cor principal" value={v.primary_color} onChange={(c) => f.set("primary_color", c)} hint="Botões e destaques" />
              <ColorField label="Cor de destaque" value={v.accent_color} onChange={(c) => f.set("accent_color", c)} hint="Selos e etiquetas" />
              <ColorField label="Cor de fundo" value={v.background_color} onChange={(c) => f.set("background_color", c)} hint="Fundo da página" />
            </div>
          </Section>
          <Section title="Estilo do título" description="Fonte usada no nome da loja e nas categorias.">
            <div className="grid grid-cols-3 gap-2">
              {FONTS.map((ft) => (
                <button
                  key={ft.value}
                  type="button"
                  onClick={() => f.set("font_style", ft.value)}
                  className={`rounded-xl border-2 p-3 text-center transition ${v.font_style === ft.value ? "border-orange-500 bg-orange-50" : "border-stone-200"}`}
                >
                  <span className={`block text-xl font-bold ${ft.cls}`}>{store.name.split(" ")[0]}</span>
                  <span className="text-xs text-stone-500">{ft.label}</span>
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* prévia */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <p className="mb-2 text-sm font-semibold text-stone-500">Prévia</p>
          <div className="overflow-hidden rounded-[2rem] border-8 border-stone-900 shadow-xl" style={{ background: v.background_color }}>
            <div className="relative h-28" style={{ background: v.primary_color }}>
              {v.banner_url && (
                 
                <img src={v.banner_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="px-4 pb-5">
              <div className="-mt-8 flex items-end gap-3">
                <div className="size-16 overflow-hidden rounded-full border-4 bg-white" style={{ borderColor: v.background_color }}>
                  {v.logo_url && (
                     
                    <img src={v.logo_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              </div>
              <p className={`mt-2 text-xl font-bold font-store-${v.font_style}`} style={{ color: readableOn(v.background_color) === "#ffffff" ? "#f5f5f4" : "#1c1917" }}>
                {store.name}
              </p>
              <div className="mt-3 flex gap-1.5">
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: v.primary_color, color: readableOn(v.primary_color) }}>
                  Pizzas
                </span>
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: v.accent_color, color: readableOn(v.accent_color) }}>
                  Novidade
                </span>
              </div>
              <div className="mt-3 rounded-xl bg-white p-3 text-sm shadow-sm">
                <p className="font-bold text-stone-900">Produto exemplo</p>
                <p className="text-xs text-stone-500">Descrição do produto</p>
                <p className="mt-1 font-bold" style={{ color: v.primary_color }}>
                  R$ 49,90
                </p>
              </div>
              <div className="mt-3 rounded-xl py-2.5 text-center text-sm font-bold" style={{ background: v.primary_color, color: readableOn(v.primary_color) }}>
                Ver carrinho
              </div>
            </div>
          </div>
        </div>
      </div>
      <SaveBar dirty={f.dirty} saving={f.saving} onSave={() => f.save()} onReset={f.reset} />
    </div>
  );
}

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (c: string) => void; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white p-1.5 pr-3 shadow-sm">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="size-9 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
        <input
          className="w-full bg-transparent font-mono text-sm uppercase outline-none"
          value={value}
          maxLength={7}
          onChange={(e) => {
            const c = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            if (/^#[0-9a-fA-F]{0,6}$/.test(c)) onChange(c.toUpperCase());
          }}
        />
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
