"use client";

import { ArrowLeft, Check, Clock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDateTime, money, onlyDigits, PAYMENT_LABEL, statusLabel } from "@/lib/format";
import { buildWhatsappMessage, whatsappLink } from "@/lib/order-message";
import type { Order, OrderStatus } from "@/lib/types";
import { WhatsIcon } from "./CartSheet";
import { PixBox } from "./PixBox";
import { ReceiptButton } from "./ReceiptButton";
import type { PublicStore } from "./types";

const FLOW: OrderStatus[] = ["new", "received", "preparing", "out_for_delivery", "completed"];

export function OrderTracker({ store, order }: { store: PublicStore; order: Order }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);

  useEffect(() => {
    if (status === "completed" || status === "cancelled") return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/public/orders/${order.public_token}`, { cache: "no-store" });
        if (r.ok) setStatus((await r.json()).status);
      } catch {}
    }, 15_000);
    return () => clearInterval(t);
  }, [order.public_token, status]);

  const idx = FLOW.indexOf(status);
  const message = buildWhatsappMessage(store.name, order);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <a href={`/${store.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
        <ArrowLeft className="size-4" /> Voltar ao cardápio
      </a>
      <div className="mt-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-line">
        <div className="flex items-center gap-3">
          {store.logo_url && (
             
            <img src={store.logo_url} alt="" className="size-12 rounded-full object-cover" />
          )}
          <div>
            <p className="text-sm text-ink-soft">{store.name}</p>
            <h1 className="text-xl font-extrabold">Pedido #{order.number}</h1>
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-soft">Feito em {formatDateTime(order.created_at, store.timezone)}</p>

        {status === "cancelled" ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800">
            <X className="size-6" />
            <div>
              <p className="font-bold">Pedido cancelado</p>
              <p className="text-sm">Em caso de dúvidas, fale com a loja pelo WhatsApp.</p>
            </div>
          </div>
        ) : (
          <ol className="mt-5 space-y-0">
            {FLOW.map((s, i) => {
              const done = i < idx || status === "completed";
              const current = i === idx && status !== "completed";
              return (
                <li key={s} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                        done ? "bg-emerald-500 text-white" : current ? "bg-brand text-brand-fg ring-4 ring-brand/20" : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      {done ? <Check className="size-4" /> : i + 1}
                    </span>
                    {i < FLOW.length - 1 && <span className={`w-0.5 flex-1 ${done ? "bg-emerald-400" : "bg-stone-200"}`} style={{ minHeight: 20 }} />}
                  </div>
                  <div className="pb-4">
                    <p className={`font-semibold ${current ? "" : done ? "text-ink-main" : "text-ink-soft"}`}>
                      {s === "new" ? "Pedido enviado — aguardando confirmação da loja" : statusLabel(s, order.fulfillment)}
                    </p>
                    {current && s === "new" && (
                      <p className="flex items-center gap-1 text-sm text-ink-soft">
                        <Clock className="size-3.5" /> A loja ainda não confirmou o recebimento.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {status === "new" && onlyDigits(store.whatsapp).length >= 10 && (
          <a
            href={whatsappLink(store.whatsapp, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-bold text-white"
          >
            <WhatsIcon /> Enviar/Reenviar pelo WhatsApp
          </a>
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-card p-5 text-sm shadow-sm ring-1 ring-line">
        <h2 className="mb-2 font-bold">Itens</h2>
        {order.items.map((it) => (
          <div key={it.id} className="border-b border-line py-2 last:border-0">
            <div className="flex justify-between gap-2">
              <span className="font-medium">
                {it.quantity}x {it.name}
              </span>
              <span className="tabular-nums">{money(it.total_cents)}</span>
            </div>
            {it.options.length > 0 && <p className="text-ink-soft">{it.options.map((o) => o.name).join(" · ")}</p>}
            {it.notes && <p className="italic text-ink-soft">Obs.: {it.notes}</p>}
          </div>
        ))}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">{money(order.subtotal_cents)}</span>
          </div>
          {order.fulfillment === "delivery" && (
            <div className="flex justify-between">
              <span>Entrega</span>
              <span className="tabular-nums">{order.delivery_fee_cents ? money(order.delivery_fee_cents) : "grátis"}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-extrabold">
            <span>Total</span>
            <span className="tabular-nums">{money(order.total_cents)}</span>
          </div>
          <p className="pt-1 text-ink-soft">Pagamento: {PAYMENT_LABEL[order.payment_method]}</p>
        </div>
      </div>

      {order.payment_method === "pix" && status !== "cancelled" && status !== "completed" && (store.pix_key || store.pix_qr_url) && (
        <div className="mt-4 space-y-4">
          <PixBox store={store} amountCents={order.total_cents} txid={`PED${order.number}`} />
          <ReceiptButton store={store} order={order} />
        </div>
      )}
    </div>
  );
}
