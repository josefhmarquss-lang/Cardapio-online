"use client";

import { Bike, ChevronRight, ClipboardList, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatDateTime, money, statusLabel } from "@/lib/format";
import type { Fulfillment, OrderStatus } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";

type MyOrder = {
  token: string;
  number: number;
  status: OrderStatus;
  fulfillment: Fulfillment;
  total_cents: number;
  created_at: string;
  items: number;
};

const EVENT = "meus-pedidos";
const key = (slug: string) => `meus-pedidos:${slug}`;

function readTokens(slug: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key(slug)) || "[]");
    return Array.isArray(v)
      ? v.filter((t) => typeof t === "string").slice(0, 20)
      : [];
  } catch {
    return [];
  }
}

/** Guarda o código do pedido neste aparelho (chamado quando o pedido é enviado). */
export function rememberOrder(slug: string, token: string) {
  try {
    const list = [token, ...readTokens(slug).filter((t) => t !== token)].slice(
      0,
      20,
    );
    localStorage.setItem(key(slug), JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

const ACTIVE: OrderStatus[] = [
  "new",
  "received",
  "preparing",
  "out_for_delivery",
];

const TONE: Record<OrderStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  received: "bg-sky-100 text-sky-800",
  preparing: "bg-violet-100 text-violet-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-600",
};

function label(o: MyOrder) {
  return o.status === "new"
    ? "Aguardando confirmação"
    : statusLabel(o.status, o.fulfillment);
}

export function useMyOrders(slug: string) {
  const [orders, setOrders] = useState<MyOrder[]>([]);

  const refresh = useCallback(async () => {
    const tokens = readTokens(slug);
    if (!tokens.length) return setOrders([]);
    try {
      const r = await fetch("/api/public/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, tokens }),
        cache: "no-store",
      });
      if (r.ok) setOrders((await r.json()).orders);
    } catch {}
  }, [slug]);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(EVENT, onChange);
    const t = setInterval(refresh, 20_000);
    const vis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener(EVENT, onChange);
      clearInterval(t);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [refresh]);

  return { orders, active: orders.filter((o) => ACTIVE.includes(o.status)) };
}

/** Botão "Pedidos" do cardápio, com a lista dos pedidos feitos neste aparelho. */
export function MyOrdersButton({
  slug,
  orders,
  activeCount,
  timezone,
}: {
  slug: string;
  orders: MyOrder[];
  activeCount: number;
  timezone: string;
}) {
  const [open, setOpen] = useState(false);
  if (!orders.length) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-card px-3 text-sm font-semibold ring-1 ring-line"
        aria-label="Meus pedidos"
      >
        <ClipboardList className="size-4" />
        <span>Pedidos</span>
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-brand-fg">
            {activeCount}
          </span>
        )}
      </button>
      {open &&
        createPortal(
          <Sheet
            open={open}
            onClose={() => setOpen(false)}
            title="Meus pedidos"
          >
            <ul className="divide-y divide-stone-100">
              {orders.map((o) => (
                <li key={o.token}>
                  <a
                    href={`/${slug}/pedido/${o.token}`}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-stone-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-extrabold">
                          #{o.number}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[o.status]}`}
                        >
                          {label(o)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-stone-500">
                        {formatDateTime(o.created_at, timezone)} · {o.items}{" "}
                        {o.items === 1 ? "item" : "itens"} ·{" "}
                        {money(o.total_cents)}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-stone-400" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="px-5 py-4 text-xs text-stone-500">
              Aparecem aqui os pedidos feitos neste aparelho. A situação é
              atualizada sozinha.
            </p>
          </Sheet>,
          document.body,
        )}
    </>
  );
}

/** Faixa no cardápio enquanto houver pedido em andamento. */
export function ActiveOrderBanner({
  slug,
  order,
}: {
  slug: string;
  order: MyOrder | undefined;
}) {
  if (!order) return null;
  const Icon = order.status === "out_for_delivery" ? Bike : Clock;
  return (
    <a
      href={`/${slug}/pedido/${order.token}`}
      className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl bg-stone-900 px-4 py-3.5 text-white shadow-xl shadow-black/20"
    >
      <Icon className="size-5 shrink-0 text-accent" />
      <span className="min-w-0 flex-1 text-sm">
        <strong>Pedido #{order.number}:</strong> {label(order)}
      </span>
      <span className="text-sm font-bold underline underline-offset-2">
        Acompanhar
      </span>
    </a>
  );
}
