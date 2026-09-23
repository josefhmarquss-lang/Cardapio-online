"use client";

import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Category, OptionGroup, Product } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";
import { api } from "./api";
import { ImageInput, MoneyInput, Toggle, useToast } from "./ui";

export type ProductDraft = Omit<Product, "id" | "store_id" | "position"> & { id?: number };

const rid = () => Math.random().toString(36).slice(2, 9);

const PRESETS: { label: string; make: () => OptionGroup }[] = [
  {
    label: "Tamanhos",
    make: () => ({
      id: rid(),
      name: "Tamanho",
      min: 1,
      max: 1,
      items: [
        { id: rid(), name: "Média", price_cents: 0 },
        { id: rid(), name: "Grande", price_cents: 1000 },
      ],
    }),
  },
  {
    label: "Borda recheada",
    make: () => ({
      id: rid(),
      name: "Borda recheada",
      min: 0,
      max: 1,
      items: [
        { id: rid(), name: "Catupiry", price_cents: 800 },
        { id: rid(), name: "Cheddar", price_cents: 800 },
      ],
    }),
  },
  {
    label: "Adicionais",
    make: () => ({ id: rid(), name: "Adicionais", min: 0, max: 3, items: [{ id: rid(), name: "Bacon", price_cents: 600 }] }),
  },
  { label: "Grupo vazio", make: () => ({ id: rid(), name: "", min: 0, max: 1, items: [{ id: rid(), name: "", price_cents: 0 }] }) },
];

export function ProductEditor({
  draft,
  categories,
  onClose,
  onSaved,
}: {
  draft: ProductDraft | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [p, setP] = useState<ProductDraft | null>(draft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    setP(draft ? structuredClone(draft) : null);
    setError("");
  }, [draft]);

  if (!p) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;

  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => setP({ ...p, [k]: v });
  const setGroup = (i: number, g: Partial<OptionGroup>) => set("option_groups", p.option_groups.map((x, j) => (j === i ? { ...x, ...g } : x)));

  async function save() {
    if (!p) return;
    setError("");
    if (!p.name.trim()) return setError("Informe o nome do produto.");
    for (const g of p.option_groups) {
      if (!g.name.trim()) return setError("Dê um nome para cada grupo de opções.");
      if (g.items.some((i) => !i.name.trim())) return setError(`Preencha o nome de todas as opções em "${g.name}".`);
    }
    setSaving(true);
    try {
      const body = {
        category_id: p.category_id,
        name: p.name,
        description: p.description,
        price_cents: p.price_cents,
        image_url: p.image_url,
        is_available: p.is_available,
        is_featured: p.is_featured,
        tag: p.tag,
        option_groups: p.option_groups.map((g) => ({ ...g, max: Math.max(g.max, g.min, 1) })),
      };
      const { product } = p.id
        ? await api<{ product: Product }>(`/api/admin/products/${p.id}`, "PUT", body)
        : await api<{ product: Product }>("/api/admin/products", "POST", body);
      toast("ok", p.id ? "Produto atualizado." : "Produto cadastrado.");
      onSaved(product);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={!!draft}
      onClose={onClose}
      wide
      title={p.id ? "Editar produto" : "Novo produto"}
      footer={
        <div className="flex items-center gap-3">
          {error && <p className="flex-1 text-sm font-medium text-red-600">{error}</p>}
          <div className="ml-auto flex gap-2">
            <button className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />} Salvar produto
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 px-5 py-5">
        <div>
          <span className="label">Foto</span>
          <ImageInput value={p.image_url} onChange={(u) => set("image_url", u)} maxSide={1200} hint="Dica: fotos quadradas e bem iluminadas vendem mais." />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nome</label>
            <input className="field" value={p.name} onChange={(e) => set("name", e.target.value)} maxLength={80} placeholder="Ex.: Pizza Margherita" autoFocus={!p.id} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descrição</label>
            <textarea className="field resize-none" rows={3} value={p.description} onChange={(e) => set("description", e.target.value)} maxLength={500} placeholder="Ingredientes, tamanho, peso…" />
          </div>
          <div>
            <label className="label">Preço</label>
            <MoneyInput value={p.price_cents} onChange={(v) => set("price_cents", v)} />
            <p className="hint">Com opções de tamanho, use o preço do menor tamanho.</p>
          </div>
          <div>
            <label className="label">Categoria</label>
            <select className="field" value={p.category_id} onChange={(e) => set("category_id", Number(e.target.value))}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Selo (opcional)</label>
            <input className="field" value={p.tag} onChange={(e) => set("tag", e.target.value)} maxLength={24} placeholder="Ex.: Mais pedida, Novo, Vegano" />
          </div>
          <div className="space-y-2 rounded-xl bg-stone-50 p-3">
            <Toggle checked={p.is_available} onChange={(v) => set("is_available", v)} label="Disponível" description="Desligue quando o item acabar." />
            <Toggle checked={p.is_featured} onChange={(v) => set("is_featured", v)} label="Destaque" description="Aparece no topo do cardápio." />
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="font-bold">Opções e adicionais</h3>
              <p className="text-sm text-stone-500">Tamanhos, bordas, sabores, adicionais… (opcional)</p>
            </div>
          </div>
          <div className="space-y-3">
            {p.option_groups.map((g, gi) => (
              <div key={g.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex gap-2">
                  <input className="field font-semibold" value={g.name} onChange={(e) => setGroup(gi, { name: e.target.value })} placeholder="Nome do grupo (ex.: Tamanho)" maxLength={60} />
                  <button className="btn-ghost px-2.5 text-red-600 hover:bg-red-50" onClick={() => set("option_groups", p.option_groups.filter((_, j) => j !== gi))} aria-label="Remover grupo">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="size-4 accent-orange-600" checked={g.min > 0} onChange={(e) => setGroup(gi, { min: e.target.checked ? 1 : 0 })} />
                    Obrigatório
                  </label>
                  <label className="flex items-center gap-2">
                    Máximo de escolhas
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="field w-20 py-1.5"
                      value={g.max}
                      onChange={(e) => setGroup(gi, { max: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
                    />
                  </label>
                  <span className="text-xs text-stone-500">{g.max === 1 ? "Cliente escolhe apenas 1" : `Cliente escolhe até ${g.max}`}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {g.items.map((it, ii) => (
                    <div key={it.id} className="flex gap-2">
                      <input
                        className="field"
                        value={it.name}
                        placeholder="Nome da opção"
                        maxLength={60}
                        onChange={(e) => setGroup(gi, { items: g.items.map((x, k) => (k === ii ? { ...x, name: e.target.value } : x)) })}
                      />
                      <MoneyInput
                        className="w-36 shrink-0"
                        value={it.price_cents}
                        placeholder="+ 0,00"
                        onChange={(v) => setGroup(gi, { items: g.items.map((x, k) => (k === ii ? { ...x, price_cents: v } : x)) })}
                      />
                      <button
                        className="btn-ghost shrink-0 px-2.5 text-stone-400"
                        disabled={g.items.length === 1}
                        onClick={() => setGroup(gi, { items: g.items.filter((_, k) => k !== ii) })}
                        aria-label="Remover opção"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  <button className="btn-ghost px-2 text-orange-700" onClick={() => setGroup(gi, { items: [...g.items, { id: rid(), name: "", price_cents: 0 }] })}>
                    <Plus className="size-4" /> Adicionar opção
                  </button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((pr) => (
                <button key={pr.label} className="btn-outline py-2" onClick={() => set("option_groups", [...p.option_groups, pr.make()])}>
                  <Plus className="size-4" /> {pr.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
