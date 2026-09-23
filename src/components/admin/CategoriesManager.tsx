"use client";

import { ArrowDown, ArrowUp, Check, Eye, EyeOff, LayoutGrid, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Category } from "@/lib/types";
import { api } from "./api";
import { Empty, PageHeader, useToast } from "./ui";

export function CategoriesManager({ initial, counts }: { initial: Category[]; counts: Record<number, number> }) {
  const [cats, setCats] = useState(initial);
  const [editing, setEditing] = useState<number | "new" | null>(initial.length ? null : "new");
  const [form, setForm] = useState({ name: "", description: "" });
  const toast = useToast();

  function startEdit(c?: Category) {
    setEditing(c ? c.id : "new");
    setForm({ name: c?.name ?? "", description: c?.description ?? "" });
  }

  async function save() {
    if (!form.name.trim()) return toast("error", "Informe o nome da categoria.");
    try {
      if (editing === "new") {
        const { category } = await api<{ category: Category }>("/api/admin/categories", "POST", { ...form, is_active: true });
        setCats((l) => [...l, category]);
        toast("ok", "Categoria criada.");
      } else if (typeof editing === "number") {
        const cur = cats.find((c) => c.id === editing)!;
        const { category } = await api<{ category: Category }>(`/api/admin/categories/${editing}`, "PUT", { ...form, is_active: cur.is_active });
        setCats((l) => l.map((c) => (c.id === category.id ? category : c)));
        toast("ok", "Categoria atualizada.");
      }
      setEditing(null);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Erro.");
    }
  }

  async function toggleActive(c: Category) {
    try {
      const { category } = await api<{ category: Category }>(`/api/admin/categories/${c.id}`, "PUT", {
        name: c.name,
        description: c.description,
        is_active: !c.is_active,
      });
      setCats((l) => l.map((x) => (x.id === c.id ? category : x)));
      toast("ok", category.is_active ? "Categoria visível no cardápio." : "Categoria oculta do cardápio.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Erro.");
    }
  }

  async function remove(c: Category) {
    if (!window.confirm(`Excluir a categoria "${c.name}"?`)) return;
    try {
      await api(`/api/admin/categories/${c.id}`, "DELETE");
      setCats((l) => l.filter((x) => x.id !== c.id));
      toast("ok", "Categoria excluída.");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Erro.");
    }
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= cats.length) return;
    const next = [...cats];
    [next[i], next[j]] = [next[j], next[i]];
    setCats(next);
    try {
      await api("/api/admin/categories/reorder", "POST", { ids: next.map((c) => c.id) });
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Erro.");
    }
  }

  const formRow = (
    <div className="flex flex-col gap-2 p-4 sm:flex-row">
      <input className="field sm:w-64" placeholder="Nome (ex.: Pizzas Doces)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} autoFocus onKeyDown={(e) => e.key === "Enter" && save()} />
      <input className="field flex-1" placeholder="Descrição curta (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={200} onKeyDown={(e) => e.key === "Enter" && save()} />
      <div className="flex gap-2">
        <button className="btn-primary" onClick={save}>
          <Check className="size-4" /> Salvar
        </button>
        {cats.length > 0 && (
          <button className="btn-ghost" onClick={() => setEditing(null)} aria-label="Cancelar">
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Categorias" description="Organize o cardápio em seções. Use as setas para definir a ordem.">
        <button className="btn-primary" onClick={() => startEdit()}>
          <Plus className="size-4" /> Nova categoria
        </button>
      </PageHeader>

      {cats.length === 0 && editing !== "new" ? (
        <Empty icon={LayoutGrid} title="Nenhuma categoria" text="Crie a primeira categoria do seu cardápio." />
      ) : (
        <div className="card divide-y divide-stone-100 overflow-hidden">
          {editing === "new" && <div className="bg-orange-50/50">{formRow}</div>}
          {cats.map((c, i) =>
            editing === c.id ? (
              <div key={c.id} className="bg-orange-50/50">
                {formRow}
              </div>
            ) : (
              <div key={c.id} className={`flex items-center gap-3 px-4 py-3.5 ${c.is_active ? "" : "bg-stone-50"}`}>
                <div className="flex flex-col">
                  <button className="rounded p-0.5 text-stone-400 hover:bg-stone-100 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">
                    <ArrowUp className="size-4" />
                  </button>
                  <button className="rounded p-0.5 text-stone-400 hover:bg-stone-100 disabled:opacity-30" disabled={i === cats.length - 1} onClick={() => move(i, 1)} aria-label="Descer">
                    <ArrowDown className="size-4" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${c.is_active ? "text-stone-900" : "text-stone-400 line-through"}`}>{c.name}</p>
                  <p className="truncate text-sm text-stone-500">
                    {counts[c.id] ?? 0} produto(s){c.description && ` · ${c.description}`}
                  </p>
                </div>
                <button className="btn-ghost px-2.5" onClick={() => toggleActive(c)} title={c.is_active ? "Ocultar do cardápio" : "Mostrar no cardápio"}>
                  {c.is_active ? <Eye className="size-4" /> : <EyeOff className="size-4 text-stone-400" />}
                </button>
                <button className="btn-ghost px-2.5" onClick={() => startEdit(c)} aria-label="Editar">
                  <Pencil className="size-4" />
                </button>
                <button className="btn-ghost px-2.5 text-red-600 hover:bg-red-50" onClick={() => remove(c)} aria-label="Excluir">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
