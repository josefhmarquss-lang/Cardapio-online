"use client";

import { Bike, Check, ChefHat, ClipboardList, Clock, MapPin, Phone, Printer, RefreshCw, Store as StoreIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatDateTime, formatPhone, formatTime, money, PAYMENT_LABEL, statusLabel, whatsappNumber } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { useOrderPulse } from "./AdminShell";
import { api } from "./api";
import { Empty, PageHeader, useToast } from "./ui";

type Filter = "active" | "finished" | "all";

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-orange-100 text-orange-800 ring-orange-200",
  received: "bg-sky-100 text-sky-800 ring-sky-200",
  preparing: "bg-violet-100 text-violet-800 ring-violet-200",
  out_for_delivery: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  completed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  cancelled: "bg-stone-200 text-stone-600 ring-stone-300",
};

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: (o: Order) => string; icon: React.ElementType }>> = {
  new: { to: "received", label: () => "Confirmar recebimento", icon: Check },
  received: { to: "preparing", label: () => "Iniciar preparo", icon: ChefHat },
  preparing: { to: "out_for_delivery", label: (o) => (o.fulfillment === "pickup" ? "Pronto para retirada" : "Saiu para entrega"), icon: Bike },
  out_for_delivery: { to: "completed", label: () => "Concluir pedido", icon: Check },
};

export function OrdersBoard({
  initial,
  stats,
  timezone,
  storeName,
}: {
  initial: Order[];
  stats: { count: number; revenue: number; open: number };
  timezone: string;
  storeName: string;
}) {
  const [filter, setFilter] = useState<Filter>("active");
  const [orders, setOrders] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { version } = useOrderPulse();
  const toast = useToast();
  const router = useRouter();
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const load = useCallback(async (f: Filter = filterRef.current) => {
    setLoading(true);
    try {
      const { orders } = await api<{ orders: Order[] }>(`/api/admin/orders?filter=${f}`);
      if (f === filterRef.current) setOrders(orders);
      api("/api/admin/orders/pulse", "POST").catch(() => {});
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (version > 0) {
      load();
      router.refresh(); // atualiza os números do topo
    }
  }, [version, load, router]);

  useEffect(() => {
    api("/api/admin/orders/pulse", "POST").catch(() => {});
    const t = setInterval(() => load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(o: Order, status: OrderStatus) {
    if (status === "cancelled" && !window.confirm(`Cancelar o pedido #${o.number}?`)) return;
    setBusyId(o.id);
    try {
      const { order } = await api<{ order: Order }>(`/api/admin/orders/${o.id}`, "PATCH", { status });
      setOrders((list) =>
        list
          .map((x) => (x.id === o.id ? order : x))
          .filter((x) => filter === "all" || (filter === "active" ? !["completed", "cancelled"].includes(x.status) : ["completed", "cancelled"].includes(x.status))),
      );
      toast("ok", `Pedido #${o.number}: ${statusLabel(status, o.fulfillment)}`);
      router.refresh();
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Pedidos" description="Os pedidos feitos no cardápio aparecem aqui automaticamente.">
        <button className="btn-outline" onClick={() => load()} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Pedidos hoje" value={String(stats.count)} />
        <Stat label="Vendas hoje" value={money(stats.revenue)} />
        <Stat label="Em andamento" value={String(stats.open)} highlight={stats.open > 0} />
      </div>

      <div className="mb-5 inline-flex rounded-xl bg-stone-200/70 p-1">
        {(
          [
            ["active", "Em andamento"],
            ["finished", "Finalizados"],
            ["all", "Todos"],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              load(f);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${filter === f ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <Empty
          icon={ClipboardList}
          title={filter === "active" ? "Nenhum pedido em andamento" : "Nenhum pedido por aqui"}
          text="Quando um cliente enviar um pedido pelo cardápio, ele aparecerá nesta tela com um aviso sonoro."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map((o) => (
            <OrderCard key={o.id} o={o} tz={timezone} busy={busyId === o.id} onStatus={(s) => setStatus(o, s)} storeName={storeName} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? "border-orange-200 bg-orange-50" : ""}`}>
      <p className="text-xs font-medium text-stone-500 sm:text-sm">{label}</p>
      <p className="mt-1 truncate text-lg font-extrabold tabular-nums text-stone-900 sm:text-2xl">{value}</p>
    </div>
  );
}

function OrderCard({ o, tz, busy, onStatus, storeName }: { o: Order; tz: string; busy: boolean; onStatus: (s: OrderStatus) => void; storeName: string }) {
  const next = NEXT[o.status];
  const isNew = o.status === "new";
  const done = o.status === "completed" || o.status === "cancelled";
  const phone = whatsappNumber(o.customer_phone);

  return (
    <article className={`card overflow-hidden ${isNew ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-stone-100" : ""}`}>
      <header className={`flex items-start justify-between gap-3 px-5 py-4 ${isNew ? "bg-orange-50" : "bg-stone-50/60"}`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold tabular-nums">#{o.number}</h3>
            {isNew && <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[11px] font-bold uppercase text-white">Novo</span>}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500" title={formatDateTime(o.created_at, tz)}>
            <Clock className="size-3" /> {formatDateTime(o.created_at, tz)}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${STATUS_STYLE[o.status]}`}>{statusLabel(o.status, o.fulfillment)}</span>
      </header>

      <div className="space-y-4 px-5 py-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-bold text-stone-900">{o.customer_name}</p>
            {o.customer_phone && (
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-stone-600">
                <Phone className="size-3.5" /> {formatPhone(o.customer_phone)}
                {phone && (
                  <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:underline">
                    WhatsApp
                  </a>
                )}
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
              o.fulfillment === "delivery" ? "bg-sky-50 text-sky-800" : "bg-amber-50 text-amber-800"
            }`}
          >
            {o.fulfillment === "delivery" ? <Bike className="size-3.5" /> : <StoreIcon className="size-3.5" />}
            {o.fulfillment === "delivery" ? "Entrega" : "Retirada"}
          </span>
        </div>

        {o.fulfillment === "delivery" && (
          <div className="flex gap-2 rounded-xl bg-stone-50 p-3 text-stone-700">
            <MapPin className="mt-0.5 size-4 shrink-0 text-stone-400" />
            <div>
              <p className="font-medium">
                {o.address_street}, {o.address_number}
                {o.address_complement && ` — ${o.address_complement}`}
              </p>
              <p>{o.address_neighborhood}</p>
              {o.address_reference && <p className="text-stone-500">Ref.: {o.address_reference}</p>}
            </div>
          </div>
        )}

        <ul className="divide-y divide-stone-100 rounded-xl border border-stone-100">
          {o.items.map((it) => (
            <li key={it.id} className="px-3 py-2.5">
              <div className="flex justify-between gap-3">
                <span className="font-semibold">
                  <span className="mr-1 inline-grid min-w-6 place-items-center rounded-md bg-stone-900 px-1 text-xs text-white">{it.quantity}</span> {it.name}
                </span>
                <span className="tabular-nums text-stone-600">{money(it.total_cents)}</span>
              </div>
              {it.options.length > 0 && (
                <ul className="mt-1 space-y-0.5 pl-8 text-stone-600">
                  {it.options.map((op, i) => (
                    <li key={i}>
                      <span className="text-stone-400">{op.group}:</span> {op.name}
                      {op.price_cents > 0 && <span className="text-stone-400"> (+{money(op.price_cents)})</span>}
                    </li>
                  ))}
                </ul>
              )}
              {it.notes && <p className="mt-1 rounded-md bg-amber-50 px-2 py-1 pl-8 font-medium text-amber-900">Obs.: {it.notes}</p>}
            </li>
          ))}
        </ul>

        {o.notes && <p className="rounded-xl bg-amber-50 p-3 font-medium text-amber-900">📝 {o.notes}</p>}

        <div className="space-y-1 border-t border-dashed border-stone-200 pt-3">
          <Line label="Subtotal" value={money(o.subtotal_cents)} />
          {o.fulfillment === "delivery" && <Line label="Taxa de entrega" value={o.delivery_fee_cents ? money(o.delivery_fee_cents) : "grátis"} />}
          <Line label="Total" value={money(o.total_cents)} bold />
          <p className="pt-1 text-stone-600">
            Pagamento: <strong>{PAYMENT_LABEL[o.payment_method]}</strong>
            {o.payment_method === "cash" && o.change_for_cents ? ` · troco para ${money(o.change_for_cents)} (levar ${money(o.change_for_cents - o.total_cents)})` : ""}
          </p>
          {o.payment_method === "pix" && !done && <p className="text-xs text-stone-500">Confira o recebimento do Pix no app do seu banco antes de confirmar.</p>}
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-stone-100 bg-stone-50/60 px-5 py-3">
        {next && (
          <button className="btn-primary flex-1" disabled={busy} onClick={() => onStatus(next.to)}>
            <next.icon className="size-4" /> {next.label(o)}
          </button>
        )}
        <select
          className="field w-auto py-2 text-sm"
          value={o.status}
          disabled={busy}
          onChange={(e) => onStatus(e.target.value as OrderStatus)}
          aria-label="Alterar status"
        >
          {(["new", "received", "preparing", "out_for_delivery", "completed", "cancelled"] as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabel(s, o.fulfillment)}
            </option>
          ))}
        </select>
        <button className="btn-ghost" onClick={() => printOrder(o, tz, storeName)} title="Imprimir">
          <Printer className="size-4" />
        </button>
        {!done && (
          <button className="btn-ghost text-red-600 hover:bg-red-50" disabled={busy} onClick={() => onStatus("cancelled")} title="Cancelar pedido">
            <X className="size-4" />
          </button>
        )}
      </footer>
    </article>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-extrabold text-stone-900" : "text-stone-600"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/** Comanda simples para impressora térmica/comum. */
function printOrder(o: Order, tz: string, storeName: string) {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  const items = o.items
    .map(
      (it) =>
        `<div class="it"><b>${it.quantity}x ${esc(it.name)}</b><span>${money(it.total_cents)}</span></div>` +
        it.options.map((op) => `<div class="op">- ${esc(op.group)}: ${esc(op.name)}</div>`).join("") +
        (it.notes ? `<div class="op"><i>Obs.: ${esc(it.notes)}</i></div>` : ""),
    )
    .join("");
  const addr =
    o.fulfillment === "delivery"
      ? `<p><b>ENTREGA</b><br>${esc(o.address_street)}, ${esc(o.address_number)} ${esc(o.address_complement)}<br>${esc(o.address_neighborhood)}${o.address_reference ? `<br>Ref.: ${esc(o.address_reference)}` : ""}</p>`
      : `<p><b>RETIRADA NO LOCAL</b></p>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Pedido #${o.number}</title><style>
    body{font:13px/1.35 monospace;width:280px;margin:0 auto;padding:8px}h1{font-size:18px;margin:4px 0}
    .it{display:flex;justify-content:space-between;margin-top:6px}.op{padding-left:10px}hr{border:0;border-top:1px dashed #000}
    .t{display:flex;justify-content:space-between}</style></head><body>
    <h1>${esc(storeName)}</h1><p>Pedido <b>#${o.number}</b><br>${formatDateTime(o.created_at, tz)}</p><hr>
    <p><b>${esc(o.customer_name)}</b><br>${esc(formatPhone(o.customer_phone))}</p>${addr}<hr>${items}<hr>
    <div class="t"><span>Subtotal</span><span>${money(o.subtotal_cents)}</span></div>
    ${o.fulfillment === "delivery" ? `<div class="t"><span>Entrega</span><span>${money(o.delivery_fee_cents)}</span></div>` : ""}
    <div class="t"><b>TOTAL</b><b>${money(o.total_cents)}</b></div>
    <p>Pagamento: ${PAYMENT_LABEL[o.payment_method]}${o.change_for_cents ? ` — troco p/ ${money(o.change_for_cents)}` : ""}</p>
    ${o.notes ? `<p><b>Obs.:</b> ${esc(o.notes)}</p>` : ""}<p>Impresso às ${formatTime(new Date().toISOString(), tz)}</p>
    <script>window.onload=()=>{window.print();}</script></body></html>`;
  const w = window.open("", "_blank", "width=380,height=640");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
