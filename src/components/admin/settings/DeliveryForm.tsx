"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Store } from "@/lib/types";
import { MoneyInput, PageHeader, SaveBar, Section, Toggle } from "../ui";
import { useStoreForm } from "./useStoreForm";

const FIELDS = [
  "delivery_enabled",
  "pickup_enabled",
  "delivery_fee_cents",
  "delivery_zones",
  "min_order_cents",
  "delivery_time",
  "pickup_time",
  "delivery_info",
] as const;

const rid = () => Math.random().toString(36).slice(2, 9);

export function DeliveryForm({ store }: { store: Store }) {
  const f = useStoreForm(store, FIELDS);
  const v = f.values;
  const useZones = v.delivery_zones.length > 0;

  return (
    <div>
      <PageHeader title="Entrega e retirada" description="Defina como seus clientes recebem os pedidos." />
      <div className="space-y-6">
        <Section title="Modalidades">
          <Toggle checked={v.delivery_enabled} onChange={(x) => f.set("delivery_enabled", x)} label="Entrega (delivery)" description="O cliente informa o endereço no pedido." />
          <Toggle checked={v.pickup_enabled} onChange={(x) => f.set("pickup_enabled", x)} label="Retirada no local" description="O cliente busca o pedido na loja." />
          {!v.delivery_enabled && !v.pickup_enabled && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Ative pelo menos uma modalidade para receber pedidos.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tempo estimado de entrega</label>
              <input className="field" placeholder="Ex.: 40–60 min" maxLength={40} value={v.delivery_time} onChange={(e) => f.set("delivery_time", e.target.value)} />
            </div>
            <div>
              <label className="label">Tempo estimado para retirada</label>
              <input className="field" placeholder="Ex.: 20–30 min" maxLength={40} value={v.pickup_time} onChange={(e) => f.set("pickup_time", e.target.value)} />
            </div>
          </div>
        </Section>

        {v.delivery_enabled && (
          <Section title="Taxa de entrega e bairros atendidos">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => f.set("delivery_zones", [])}
                className={`rounded-xl border-2 p-3 text-left ${!useZones ? "border-orange-500 bg-orange-50" : "border-stone-200"}`}
              >
                <span className="block text-sm font-bold">Taxa única</span>
                <span className="text-xs text-stone-500">Mesmo valor para qualquer endereço</span>
              </button>
              <button
                type="button"
                onClick={() => !useZones && f.set("delivery_zones", [{ id: rid(), name: "", fee_cents: v.delivery_fee_cents }])}
                className={`rounded-xl border-2 p-3 text-left ${useZones ? "border-orange-500 bg-orange-50" : "border-stone-200"}`}
              >
                <span className="block text-sm font-bold">Por bairro</span>
                <span className="text-xs text-stone-500">O cliente escolhe o bairro e vê a taxa</span>
              </button>
            </div>
            {!useZones ? (
              <div className="sm:w-64">
                <label className="label">Taxa de entrega</label>
                <MoneyInput value={v.delivery_fee_cents} onChange={(c) => f.set("delivery_fee_cents", c)} placeholder="0,00 (grátis)" />
              </div>
            ) : (
              <div className="space-y-2">
                {v.delivery_zones.map((z, i) => (
                  <div key={z.id} className="flex gap-2">
                    <input
                      className="field"
                      placeholder="Nome do bairro"
                      maxLength={80}
                      value={z.name}
                      onChange={(e) => f.set("delivery_zones", v.delivery_zones.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    />
                    <MoneyInput
                      className="w-40 shrink-0"
                      value={z.fee_cents}
                      placeholder="grátis"
                      onChange={(c) => f.set("delivery_zones", v.delivery_zones.map((x, j) => (j === i ? { ...x, fee_cents: c } : x)))}
                    />
                    <button type="button" className="btn-ghost px-2.5 text-red-600" onClick={() => f.set("delivery_zones", v.delivery_zones.filter((_, j) => j !== i))} aria-label="Remover bairro">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-ghost px-2 text-orange-700" onClick={() => f.set("delivery_zones", [...v.delivery_zones, { id: rid(), name: "", fee_cents: 0 }])}>
                  <Plus className="size-4" /> Adicionar bairro
                </button>
              </div>
            )}
            <div className="sm:w-64">
              <label className="label">Pedido mínimo para entrega</label>
              <MoneyInput value={v.min_order_cents} onChange={(c) => f.set("min_order_cents", c)} placeholder="sem mínimo" />
            </div>
          </Section>
        )}

        <Section title="Informações e instruções de entrega" description="Aparece para o cliente ao finalizar o pedido.">
          <textarea
            className="field resize-none"
            rows={3}
            maxLength={600}
            placeholder="Ex.: Entregamos até 5 km. Em dias de chuva o prazo pode aumentar."
            value={v.delivery_info}
            onChange={(e) => f.set("delivery_info", e.target.value)}
          />
        </Section>
      </div>
      <SaveBar
        dirty={f.dirty}
        saving={f.saving}
        onSave={() => f.save({ delivery_zones: v.delivery_zones.filter((z) => z.name.trim()) })}
        onReset={f.reset}
      />
    </div>
  );
}
