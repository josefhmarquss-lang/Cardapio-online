"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";
import { unitPrice } from "./cart-utils";

export function ProductSheet({
  product,
  canOrder,
  closedMessage,
  onClose,
  onAdd,
}: {
  product: Product | null;
  canOrder: boolean;
  closedMessage: string;
  onClose: () => void;
  onAdd: (p: Product, optionIds: string[], qty: number, notes: string) => void;
}) {
  return (
    <Sheet open={!!product} onClose={onClose}>
      {product && (
        <ProductForm key={product.id} product={product} canOrder={canOrder} closedMessage={closedMessage} onClose={onClose} onAdd={onAdd} />
      )}
    </Sheet>
  );
}

function ProductForm({
  product: p,
  canOrder,
  closedMessage,
  onClose,
  onAdd,
}: {
  product: Product;
  canOrder: boolean;
  closedMessage: string;
  onClose: () => void;
  onAdd: (p: Product, optionIds: string[], qty: number, notes: string) => void;
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    // pré-seleciona a primeira opção de grupos obrigatórios de escolha única
    const init: Record<string, string[]> = {};
    for (const g of p.option_groups) init[g.id] = g.min === 1 && g.max === 1 && g.items[0] ? [g.items[0].id] : [];
    return init;
  });
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);

  const optionIds = useMemo(() => Object.entries(selected).flatMap(([g, ids]) => ids.map((i) => `${g}:${i}`)), [selected]);
  const unit = unitPrice(p, optionIds);
  const missing = p.option_groups.filter((g) => (selected[g.id]?.length ?? 0) < g.min);

  function toggle(groupId: string, itemId: string, max: number) {
    setSelected((s) => {
      const cur = s[groupId] ?? [];
      if (max === 1) return { ...s, [groupId]: cur[0] === itemId ? [] : [itemId] };
      if (cur.includes(itemId)) return { ...s, [groupId]: cur.filter((x) => x !== itemId) };
      if (cur.length >= max) return s;
      return { ...s, [groupId]: [...cur, itemId] };
    });
  }

  function submit() {
    setTried(true);
    if (missing.length) {
      document.getElementById(`grp-${missing[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onAdd(p, optionIds, qty, notes.trim());
  }

  return (
    <div className="flex flex-col">
      {p.image_url ? (
        <div className="relative aspect-[16/10] w-full bg-stone-100 sm:aspect-[16/9]">
          { }
          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-xl text-stone-700 shadow"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="flex justify-end p-3">
          <button onClick={onClose} className="grid size-10 place-items-center rounded-full bg-stone-100 text-xl" aria-label="Fechar">
            ×
          </button>
        </div>
      )}

      <div className="space-y-1 px-5 pb-2 pt-4">
        <h2 className="text-2xl font-extrabold tracking-tight">{p.name}</h2>
        {p.description && <p className="text-[15px] leading-relaxed text-stone-600">{p.description}</p>}
        <p className="pt-1 text-lg font-bold text-brand">{money(p.price_cents)}</p>
      </div>

      {p.option_groups.map((g) => {
        const cur = selected[g.id] ?? [];
        const bad = tried && cur.length < g.min;
        return (
          <section key={g.id} id={`grp-${g.id}`} className="mt-3">
            <div className={`flex items-center justify-between px-5 py-3 ${bad ? "bg-red-50" : "bg-stone-50"}`}>
              <div>
                <h3 className="font-bold">{g.name}</h3>
                <p className="text-xs text-stone-500">
                  {g.max === 1 ? "Escolha 1 opção" : g.min > 0 ? `Escolha de ${g.min} a ${g.max}` : `Escolha até ${g.max}`}
                </p>
              </div>
              {g.min > 0 ? (
                <span className={`rounded-md px-2 py-1 text-[11px] font-bold uppercase ${bad ? "bg-red-600 text-white" : "bg-stone-800 text-white"}`}>
                  Obrigatório
                </span>
              ) : (
                <span className="text-xs font-medium text-stone-500">
                  {cur.length}/{g.max}
                </span>
              )}
            </div>
            <ul className="divide-y divide-stone-100">
              {g.items.map((o) => {
                const on = cur.includes(o.id);
                const blocked = !on && g.max > 1 && cur.length >= g.max;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      disabled={blocked}
                      onClick={() => toggle(g.id, o.id, g.max)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-stone-50 disabled:opacity-40"
                    >
                      <span>
                        <span className="block font-medium">{o.name}</span>
                        {o.price_cents > 0 && <span className="text-sm text-stone-500">+ {money(o.price_cents)}</span>}
                      </span>
                      <span
                        className={`grid size-6 shrink-0 place-items-center border-2 transition ${g.max === 1 ? "rounded-full" : "rounded-md"} ${
                          on ? "border-brand bg-brand text-brand-fg" : "border-stone-300"
                        }`}
                      >
                        {on && <Check className="size-4" strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <div className="px-5 py-4">
        <label className="mb-1.5 block text-sm font-bold" htmlFor="obs">
          Alguma observação?
        </label>
        <textarea
          id="obs"
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 200))}
          rows={2}
          placeholder="Ex.: sem cebola, bem assada, cortar em 8 pedaços…"
          className="pfield resize-none"
        />
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-stone-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {canOrder ? (
          <>
            <div className="flex items-center rounded-xl border border-stone-200">
              <button className="grid size-11 place-items-center text-brand disabled:text-stone-300" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Diminuir">
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-bold tabular-nums">{qty}</span>
              <button className="grid size-11 place-items-center text-brand" onClick={() => setQty((q) => Math.min(50, q + 1))} aria-label="Aumentar">
                <Plus className="size-4" />
              </button>
            </div>
            <button
              onClick={submit}
              className="flex h-12 flex-1 items-center justify-between rounded-xl bg-brand px-5 font-bold text-brand-fg shadow-lg shadow-black/10 transition active:scale-[.98]"
            >
              <span>Adicionar</span>
              <span className="tabular-nums">{money(unit * qty)}</span>
            </button>
          </>
        ) : (
          <p className="w-full rounded-xl bg-stone-100 px-4 py-3 text-center text-sm font-medium text-stone-600">{closedMessage}</p>
        )}
      </div>
    </div>
  );
}
