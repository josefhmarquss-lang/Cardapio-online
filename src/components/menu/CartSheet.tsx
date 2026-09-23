"use client";

import { ArrowLeft, Bike, CheckCircle2, Clock, Minus, Plus, ShoppingBag, Store as StoreIcon, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { money, onlyDigits, PAYMENT_LABEL, parseMoney } from "@/lib/format";
import { buildWhatsappMessage, whatsappLink } from "@/lib/order-message";
import type { Fulfillment, Order, PaymentMethod, Product } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";
import { optionLabels, unitPrice } from "./cart-utils";
import { PixBox, PixLogo } from "./PixBox";
import { ReceiptButton } from "./ReceiptButton";
import type { CartLine, PublicStore } from "./types";

type Customer = {
  name: string;
  phone: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  reference: string;
  zone_id: string;
};

const EMPTY_CUSTOMER: Customer = { name: "", phone: "", street: "", number: "", complement: "", neighborhood: "", reference: "", zone_id: "" };

export function CartSheet({
  open,
  onClose,
  store,
  lines,
  products,
  canOrder,
  closedMessage,
  setQty,
  clear,
}: {
  open: boolean;
  onClose: () => void;
  store: PublicStore;
  lines: CartLine[];
  products: Map<number, Product>;
  canOrder: boolean;
  closedMessage: string;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
}) {
  const [step, setStep] = useState<"cart" | "checkout" | "done">("cart");
  const [placed, setPlaced] = useState<Order | null>(null);

  const subtotal = lines.reduce((s, l) => {
    const p = products.get(l.product_id);
    return p ? s + unitPrice(p, l.option_ids) * l.quantity : s;
  }, 0);

  function close() {
    onClose();
    if (step === "done") {
      setStep("cart");
      setPlaced(null);
    } else if (step === "checkout") setStep("cart");
  }

  const title =
    step === "cart" ? (
      "Seu pedido"
    ) : step === "checkout" ? (
      <button onClick={() => setStep("cart")} className="flex items-center gap-2">
        <ArrowLeft className="size-5" /> Finalizar pedido
      </button>
    ) : (
      "Pedido enviado"
    );

  return (
    <Sheet open={open} onClose={close} title={title}>
      {step === "cart" && (
        <CartList
          store={store}
          lines={lines}
          products={products}
          subtotal={subtotal}
          setQty={setQty}
          canOrder={canOrder}
          closedMessage={closedMessage}
          onContinue={() => setStep("checkout")}
        />
      )}
      {step === "checkout" && (
        <Checkout
          store={store}
          lines={lines}
          subtotal={subtotal}
          onPlaced={(o) => {
            setPlaced(o);
            setStep("done");
            clear();
          }}
        />
      )}
      {step === "done" && placed && <Done store={store} order={placed} />}
    </Sheet>
  );
}

function CartList({
  store,
  lines,
  products,
  subtotal,
  setQty,
  canOrder,
  closedMessage,
  onContinue,
}: {
  store: PublicStore;
  lines: CartLine[];
  products: Map<number, Product>;
  subtotal: number;
  setQty: (key: string, qty: number) => void;
  canOrder: boolean;
  closedMessage: string;
  onContinue: () => void;
}) {
  if (!lines.length)
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-stone-500">
        <ShoppingBag className="size-12 text-stone-300" />
        <p className="font-semibold text-stone-700">Seu carrinho está vazio</p>
        <p className="text-sm">Escolha os produtos no cardápio para montar seu pedido.</p>
      </div>
    );
  return (
    <div>
      <ul className="divide-y divide-stone-100">
        {lines.map((l) => {
          const p = products.get(l.product_id);
          if (!p) return null;
          const opts = optionLabels(p, l.option_ids);
          return (
            <li key={l.key} className="flex gap-3 px-5 py-4">
              {p.image_url && (
                 
                <img src={p.image_url} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <p className="font-semibold leading-tight">{p.name}</p>
                  <p className="shrink-0 font-semibold tabular-nums">{money(unitPrice(p, l.option_ids) * l.quantity)}</p>
                </div>
                {opts.length > 0 && <p className="mt-0.5 text-sm text-stone-500">{opts.join(" · ")}</p>}
                {l.notes && <p className="mt-0.5 text-sm italic text-stone-500">Obs.: {l.notes}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-stone-200">
                    <button className="grid size-8 place-items-center text-brand" onClick={() => setQty(l.key, l.quantity - 1)} aria-label="Diminuir">
                      {l.quantity === 1 ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
                    </button>
                    <span className="w-7 text-center text-sm font-bold tabular-nums">{l.quantity}</span>
                    <button className="grid size-8 place-items-center text-brand" onClick={() => setQty(l.key, Math.min(50, l.quantity + 1))} aria-label="Aumentar">
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="space-y-1 border-t border-stone-100 bg-stone-50 px-5 py-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold tabular-nums">{money(subtotal)}</span>
        </div>
        {store.delivery_enabled && (
          <p className="text-stone-500">
            {store.delivery_zones.length
              ? "Taxa de entrega calculada pelo bairro na próxima etapa."
              : store.delivery_fee_cents
                ? `Taxa de entrega: ${money(store.delivery_fee_cents)}`
                : "Entrega grátis"}
          </p>
        )}
      </div>
      <div className="sticky bottom-0 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {canOrder ? (
          <button onClick={onContinue} className="flex h-13 w-full items-center justify-between rounded-xl bg-brand px-5 py-3.5 font-bold text-brand-fg shadow-lg shadow-black/10">
            <span>Continuar</span>
            <span className="tabular-nums">{money(subtotal)}</span>
          </button>
        ) : (
          <p className="rounded-xl bg-stone-100 px-4 py-3 text-center text-sm font-medium text-stone-600">{closedMessage}</p>
        )}
      </div>
    </div>
  );
}

function Checkout({
  store,
  lines,
  subtotal,
  onPlaced,
}: {
  store: PublicStore;
  lines: CartLine[];
  subtotal: number;
  onPlaced: (o: Order) => void;
}) {
  const storageKey = `cliente:${store.slug}`;
  const [c, setC] = useState<Customer>(EMPTY_CUSTOMER);
  const [fulfillment, setFulfillment] = useState<Fulfillment>(store.delivery_enabled ? "delivery" : "pickup");
  const payments = (["pix", "cash", "card"] as PaymentMethod[]).filter(
    (m) => ({ pix: store.pay_pix, cash: store.pay_cash, card: store.pay_card })[m],
  );
  const [payment, setPayment] = useState<PaymentMethod>(payments[0] ?? "pix");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setC({ ...EMPTY_CUSTOMER, ...JSON.parse(saved) });
    } catch {}
  }, [storageKey]);

  const zone = store.delivery_zones.find((z) => z.id === c.zone_id);
  const fee = fulfillment === "delivery" ? (store.delivery_zones.length ? (zone?.fee_cents ?? 0) : store.delivery_fee_cents) : 0;
  const total = subtotal + fee;
  const belowMin = fulfillment === "delivery" && store.min_order_cents > 0 && subtotal < store.min_order_cents;

  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setC({ ...c, [k]: e.target.value });

  const valid = useMemo(() => {
    if (c.name.trim().length < 2) return "Informe seu nome.";
    if (onlyDigits(c.phone).length < 10) return "Informe um telefone com DDD.";
    if (fulfillment === "delivery") {
      if (store.delivery_zones.length && !zone) return "Selecione seu bairro.";
      if (!store.delivery_zones.length && !c.neighborhood.trim()) return "Informe seu bairro.";
      if (!c.street.trim() || !c.number.trim()) return "Informe rua e número.";
    }
    if (belowMin) return `Pedido mínimo para entrega: ${money(store.min_order_cents)}.`;
    return "";
  }, [c, fulfillment, zone, store, belowMin]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (valid) return setError(valid);
    setError("");
    setSending(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify(c));
    } catch {}
    try {
      const res = await fetch(`/api/public/stores/${store.slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: c.name,
          customer_phone: c.phone,
          fulfillment,
          address_street: c.street,
          address_number: c.number,
          address_complement: c.complement,
          address_neighborhood: c.neighborhood,
          address_reference: c.reference,
          zone_id: fulfillment === "delivery" && store.delivery_zones.length ? c.zone_id : null,
          payment_method: payment,
          change_for_cents: payment === "cash" && changeFor ? parseMoney(changeFor) : null,
          notes,
          items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity, option_ids: l.option_ids, notes: l.notes })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível enviar o pedido.");
      onPlaced(data.full as Order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 px-5 py-5">
      <section className="space-y-3">
        <h3 className="font-bold">Seus dados</h3>
        <input className="pfield" placeholder="Seu nome" value={c.name} onChange={set("name")} autoComplete="name" maxLength={80} />
        <input className="pfield" placeholder="WhatsApp / telefone com DDD" value={c.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" maxLength={20} />
      </section>

      {store.delivery_enabled && store.pickup_enabled && (
        <section className="space-y-3">
          <h3 className="font-bold">Como quer receber?</h3>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["delivery", "Entrega", Bike, store.delivery_time],
                ["pickup", "Retirar no local", StoreIcon, store.pickup_time],
              ] as const
            ).map(([v, label, Icon, time]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFulfillment(v)}
                className={`rounded-xl border-2 p-3 text-left transition ${fulfillment === v ? "border-brand bg-brand/5" : "border-stone-200"}`}
              >
                <Icon className={`size-5 ${fulfillment === v ? "text-brand" : "text-stone-400"}`} />
                <span className="mt-1 block font-semibold">{label}</span>
                {time && <span className="text-xs text-stone-500">{time}</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {fulfillment === "delivery" ? (
        <section className="space-y-3">
          <h3 className="font-bold">Endereço de entrega</h3>
          {store.delivery_zones.length > 0 ? (
            <select className="pfield" value={c.zone_id} onChange={set("zone_id")}>
              <option value="">Selecione seu bairro</option>
              {store.delivery_zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} — {z.fee_cents ? money(z.fee_cents) : "grátis"}
                </option>
              ))}
            </select>
          ) : (
            <input className="pfield" placeholder="Bairro" value={c.neighborhood} onChange={set("neighborhood")} maxLength={80} />
          )}
          <div className="grid grid-cols-[1fr_6.5rem] gap-2">
            <input className="pfield" placeholder="Rua / avenida" value={c.street} onChange={set("street")} autoComplete="address-line1" maxLength={120} />
            <input className="pfield" placeholder="Número" value={c.number} onChange={set("number")} maxLength={20} />
          </div>
          <input className="pfield" placeholder="Complemento (apto, bloco…)" value={c.complement} onChange={set("complement")} maxLength={80} />
          <input className="pfield" placeholder="Ponto de referência" value={c.reference} onChange={set("reference")} maxLength={120} />
          {store.delivery_info && <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600">{store.delivery_info}</p>}
        </section>
      ) : (
        <section className="rounded-xl bg-stone-50 p-4 text-sm">
          <p className="font-bold">Retirada no local</p>
          <p className="mt-1 text-stone-600">
            {[store.address_street, store.address_number].filter(Boolean).join(", ")}
            {store.address_neighborhood && ` — ${store.address_neighborhood}`}
          </p>
          {store.pickup_time && (
            <p className="mt-1 flex items-center gap-1 text-stone-500">
              <Clock className="size-3.5" /> Pronto em {store.pickup_time}
            </p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-bold">Pagamento</h3>
        <div className="grid grid-cols-3 gap-2">
          {payments.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPayment(m)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-sm font-semibold transition ${
                payment === m ? "border-brand bg-brand/5" : "border-stone-200"
              }`}
            >
              {m === "pix" ? <PixLogo /> : <span className="text-lg">{m === "cash" ? "💵" : "💳"}</span>}
              {m === "card" ? "Cartão" : PAYMENT_LABEL[m]}
            </button>
          ))}
        </div>
        {payment === "cash" && (
          <input className="pfield" placeholder="Troco para quanto? (opcional)" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} inputMode="decimal" />
        )}
        {payment === "card" && <p className="text-sm text-stone-500">A maquininha é levada na entrega (ou disponível no balcão).</p>}
        {payment === "pix" && (
          <p className="text-sm text-stone-500">Os dados do Pix aparecem após enviar o pedido. O pagamento é feito direto para a loja.</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-bold">Observações do pedido</h3>
        <textarea className="pfield resize-none" rows={2} placeholder="Ex.: interfone quebrado, ligar ao chegar…" value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 300))} />
      </section>

      <section className="space-y-1.5 rounded-xl bg-stone-50 p-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="tabular-nums">{money(subtotal)}</span>
        </div>
        {fulfillment === "delivery" && (
          <div className="flex justify-between">
            <span>Taxa de entrega</span>
            <span className="tabular-nums">{store.delivery_zones.length && !zone ? "selecione o bairro" : fee ? money(fee) : "grátis"}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold">
          <span>Total</span>
          <span className="tabular-nums">{money(total)}</span>
        </div>
        {belowMin && <p className="text-amber-700">Pedido mínimo para entrega: {money(store.min_order_cents)}.</p>}
      </section>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="sticky bottom-0 -mx-5 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <button disabled={sending} className="flex w-full items-center justify-between rounded-xl bg-brand px-5 py-4 font-bold text-brand-fg shadow-lg shadow-black/10 disabled:opacity-60">
          <span>{sending ? "Enviando…" : "Enviar pedido"}</span>
          <span className="tabular-nums">{money(total)}</span>
        </button>
      </div>
    </form>
  );
}

function Done({ store, order }: { store: PublicStore; order: Order }) {
  const trackPath = `/${store.slug}/pedido/${order.public_token}`;
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const message = buildWhatsappMessage(store.name, order, origin ? origin + trackPath : undefined);
  const hasWhats = onlyDigits(store.whatsapp).length >= 10;
  const showPix = order.payment_method === "pix" && !!(store.pix_key || store.pix_qr_url);

  return (
    <div className="space-y-5 px-5 py-6">
      <div className="text-center">
        <div className="mx-auto grid size-16 animate-pop place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="size-9" />
        </div>
        <h3 className="mt-3 text-xl font-extrabold">Pedido #{order.number} registrado</h3>
        <p className="mt-1 text-stone-600">
          {showPix ? (
            <>
              Agora: <strong>1)</strong> envie o pedido pelo WhatsApp, <strong>2)</strong> pague o Pix e <strong>3)</strong> mande o comprovante.{" "}
              <strong>{store.name}</strong> vai conferir e confirmar.
            </>
          ) : (
            <>
              Agora envie o pedido pelo WhatsApp. <strong>{store.name}</strong> vai conferir e confirmar o recebimento.
            </>
          )}
        </p>
        <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
          <Clock className="size-4" /> Aguardando confirmação da loja
        </p>
      </div>

      {hasWhats && (
        <a
          href={whatsappLink(store.whatsapp, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-[#1fbe5b]"
        >
          <WhatsIcon /> Enviar pedido pelo WhatsApp
        </a>
      )}

      {showPix && (
        <>
          <PixBox store={store} amountCents={order.total_cents} txid={`PED${order.number}`} />
          <ReceiptButton store={store} order={order} />
        </>
      )}

      <div className="rounded-xl bg-stone-50 p-4 text-sm">
        <div className="mb-2 font-bold">Resumo</div>
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between gap-2 py-0.5">
            <span>
              {it.quantity}x {it.name}
            </span>
            <span className="tabular-nums">{money(it.total_cents)}</span>
          </div>
        ))}
        {order.fulfillment === "delivery" && (
          <div className="flex justify-between py-0.5 text-stone-500">
            <span>Entrega</span>
            <span className="tabular-nums">{order.delivery_fee_cents ? money(order.delivery_fee_cents) : "grátis"}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t border-stone-200 pt-2 font-extrabold">
          <span>Total</span>
          <span className="tabular-nums">{money(order.total_cents)}</span>
        </div>
      </div>

      <a href={trackPath} className="block text-center text-sm font-semibold text-brand underline underline-offset-4">
        Acompanhar status do pedido
      </a>
    </div>
  );
}

export function WhatsIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5v-.5c-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3M12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 0 1-1.5-5.2C2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 7 2.9a9.8 9.8 0 0 1 2.9 7c0 5.4-4.4 9.7-9.9 9.7m8.4-18.1A11.8 11.8 0 0 0 12 .2C5.5.2.2 5.5.2 12c0 2.1.5 4.1 1.6 5.9L.1 24l6.3-1.7a11.8 11.8 0 0 0 5.6 1.4c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.4-8.3" />
    </svg>
  );
}
