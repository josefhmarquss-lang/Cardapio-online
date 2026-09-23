"use client";

import { ArrowDown, ArrowUp, Copy, Pencil, Pizza, Plus, Search, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { api } from "./api";
import { ProductEditor, type ProductDraft } from "./ProductEditor";
import { Empty, PageHeader, Toggle, useToast } from "./ui";

export function ProductsManager({ initialCategories, initialProducts }: { initialCategories: Category[]; initialProducts: Product[] }) {
  const [categories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<ProductDraft | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<number | "all">("all");
  const toast = useToast();

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => cat === "all" || c.id === cat)
      .map((c) => ({
        ...c,
        items: products
          .filter((p) => p.category_id === c.id && (!q || p.name.toLowerCase().includes(q)))
          .sort((a, b) => a.position - b.position || a.id - b.id),
      }));
  }, [categories, products, query, cat]);

  function upsert(p: Product) {
    setProducts((list) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p]));
  }

  async function toggleAvailable(p: Product, v: boolean) {
    upsert({ ...p, is_available: v });
    try {
      const { product } = await api<{ product: Product }>(`/api/admin/products/${p.id}`, "PATCH", { is_available: v });
      upsert(product);
      toast("ok", `${p.name}: ${v ? "disponível" : "indisponível"}`);
    } catch (e) {
      upsert(p);
      toast("error", e instanceof Error ? e.message : "Erro.");
    }
  }

  async function remove(p: Product) {
    if (!window.confirm(`Excluir "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api(`/api/admin/products/${p.id}`, "DELETE");
      setProducts((l) => l.filter((x) => x.id !== p.id));
      toast("ok", "Produto excluído.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Erro.");
    }
  }

  async function move(list: Product[], index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const ids = list.map((p) => p.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    const pos = new Map(ids.map((id, i) => [id, i]));
    setProducts((all) => all.map((p) => (pos.has(p.id) ? { ...p, position: pos.get(p.id)! } : p)));
    try {
      await api("/api/admin/products/reorder", "POST", { ids });
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Erro ao reordenar.");
    }
  }

  if (!categories.length)
    return (
      <div>
        <PageHeader title="Produtos" />
        <Empty icon={Pizza} title="Crie uma categoria primeiro" text="Os produtos ficam organizados em categorias (ex.: Pizzas, Bebidas, Sobremesas).">
          <Link href="/admin/categorias" className="btn-primary">
            <Plus className="size-4" /> Criar categoria
          </Link>
        </Empty>
      </div>
    );

  const newDraft = (): ProductDraft => ({
    category_id: cat === "all" ? categories[0].id : cat,
    name: "",
    description: "",
    price_cents: 0,
    image_url: null,
    is_available: true,
    is_featured: false,
    tag: "",
    option_groups: [],
  });

  return (
    <div>
      <PageHeader title="Produtos" description={`${products.length} produtos cadastrados. Alterações aparecem no cardápio na hora.`}>
        <button className="btn-primary" onClick={() => setEditing(newDraft())}>
          <Plus className="size-4" /> Novo produto
        </button>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input className="field pl-10" placeholder="Buscar produto" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {[{ id: "all" as const, name: "Todas" }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${cat === c.id ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {grouped.map((c) => (
          <section key={c.id} className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/70 px-5 py-3">
              <h2 className="font-bold">
                {c.name} <span className="font-normal text-stone-400">· {c.items.length}</span>
                {!c.is_active && <span className="ml-2 rounded bg-stone-200 px-1.5 py-0.5 text-xs font-semibold text-stone-600">categoria oculta</span>}
              </h2>
              <button className="btn-ghost py-1.5 text-orange-700" onClick={() => setEditing({ ...newDraft(), category_id: c.id })}>
                <Plus className="size-4" /> Adicionar
              </button>
            </div>
            {c.items.length === 0 ? (
              <p className="px-5 py-6 text-sm text-stone-500">Nenhum produto nesta categoria.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {c.items.map((p, i) => (
                  <li key={p.id} className={`flex items-center gap-3 px-3 py-3 sm:px-5 ${p.is_available ? "" : "bg-stone-50"}`}>
                    <div className="hidden flex-col sm:flex">
                      <button className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30" disabled={i === 0 || !!query} onClick={() => move(c.items, i, -1)} aria-label="Subir">
                        <ArrowUp className="size-4" />
                      </button>
                      <button className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30" disabled={i === c.items.length - 1 || !!query} onClick={() => move(c.items, i, 1)} aria-label="Descer">
                        <ArrowDown className="size-4" />
                      </button>
                    </div>
                    <button onClick={() => setEditing(p)} className="size-14 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                      {p.image_url && (
                         
                        <img src={p.image_url} alt="" className={`h-full w-full object-cover ${p.is_available ? "" : "opacity-50 grayscale"}`} />
                      )}
                    </button>
                    <button onClick={() => setEditing(p)} className="min-w-0 flex-1 text-left">
                      <p className="flex items-center gap-1.5 truncate font-semibold text-stone-900">
                        {p.is_featured && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                        {p.name}
                        {p.tag && <span className="hidden rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800 sm:inline">{p.tag}</span>}
                      </p>
                      <p className="truncate text-sm text-stone-500">
                        <span className="font-semibold text-stone-700">{money(p.price_cents)}</span>
                        {p.option_groups.length > 0 && ` · ${p.option_groups.map((g) => g.name).join(", ")}`}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 sm:gap-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <Toggle checked={p.is_available} onChange={(v) => toggleAvailable(p, v)} />
                        <span className="hidden text-[10px] font-medium text-stone-500 sm:block">{p.is_available ? "Disponível" : "Indisponível"}</span>
                      </div>
                      <button className="btn-ghost px-2" onClick={() => setEditing(p)} aria-label="Editar">
                        <Pencil className="size-4" />
                      </button>
                      <button
                        className="btn-ghost hidden px-2 sm:inline-flex"
                        onClick={() => setEditing({ ...p, id: undefined, name: `${p.name} (cópia)` })}
                        aria-label="Duplicar"
                        title="Duplicar"
                      >
                        <Copy className="size-4" />
                      </button>
                      <button className="btn-ghost px-2 text-red-600 hover:bg-red-50" onClick={() => remove(p)} aria-label="Excluir">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <ProductEditor
        draft={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={(p) => {
          upsert(p);
          setEditing(null);
        }}
      />
    </div>
  );
}
