"use client";

import { Bike, Clock, CreditCard, AtSign, MapPin, Phone, Store as StoreIcon } from "lucide-react";
import { formatPhone, money, onlyDigits, storeAddress, whatsappNumber } from "@/lib/format";
import { DAY_NAMES } from "@/lib/hours";
import { Sheet } from "@/components/ui/Sheet";
import { WhatsIcon } from "./CartSheet";
import type { PublicStore } from "./types";

export function StoreInfoSheet({ store, open, onClose }: { store: PublicStore; open: boolean; onClose: () => void }) {
  const address = storeAddress(store);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const order = [1, 2, 3, 4, 5, 6, 0];
  const pays = [store.pay_pix && "Pix", store.pay_cash && "Dinheiro", store.pay_card && "Cartão de crédito/débito"].filter(Boolean);

  return (
    <Sheet open={open} onClose={onClose} title="Sobre a loja">
      <div className="space-y-6 px-5 py-5 text-[15px]">
        {store.about && <p className="leading-relaxed text-stone-600">{store.about}</p>}

        {address && (
          <Row icon={MapPin} title="Endereço">
            <p>{address}</p>
            <a href={maps} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand underline underline-offset-2">
              Ver no mapa
            </a>
          </Row>
        )}

        <Row icon={Clock} title="Horário de funcionamento">
          {store.open_mode !== "auto" && (
            <p className="mb-2 text-sm font-medium text-stone-500">
              {store.open_mode === "open" ? "A loja está recebendo pedidos agora." : "A loja está temporariamente fechada."}
            </p>
          )}
          <table className="w-full text-sm">
            <tbody>
              {order.map((d) => {
                const h = store.opening_hours.find((x) => x.day === d);
                return (
                  <tr key={d} className="border-b border-stone-100 last:border-0">
                    <td className="py-1.5 text-stone-600">{DAY_NAMES[d]}</td>
                    <td className="py-1.5 text-right font-medium tabular-nums">{!h || h.closed ? "Fechado" : `${h.open} – ${h.close}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Row>

        {(store.delivery_enabled || store.pickup_enabled) && (
          <Row icon={Bike} title="Entrega e retirada">
            <ul className="space-y-1 text-sm">
              {store.delivery_enabled && (
                <li>
                  Entrega {store.delivery_time && `em ${store.delivery_time}`}
                  {!store.delivery_zones.length && ` · taxa ${store.delivery_fee_cents ? money(store.delivery_fee_cents) : "grátis"}`}
                </li>
              )}
              {store.pickup_enabled && <li>Retirada no local {store.pickup_time && `em ${store.pickup_time}`}</li>}
              {store.min_order_cents > 0 && store.delivery_enabled && <li>Pedido mínimo para entrega: {money(store.min_order_cents)}</li>}
            </ul>
            {store.delivery_enabled && store.delivery_zones.length > 0 && (
              <div className="mt-3 rounded-xl bg-stone-50 p-3">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-500">Bairros atendidos</p>
                <ul className="grid grid-cols-1 gap-x-4 text-sm sm:grid-cols-2">
                  {store.delivery_zones.map((z) => (
                    <li key={z.id} className="flex justify-between py-1">
                      <span>{z.name}</span>
                      <span className="font-medium tabular-nums">{z.fee_cents ? money(z.fee_cents) : "grátis"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {store.delivery_info && <p className="mt-2 text-sm text-stone-500">{store.delivery_info}</p>}
          </Row>
        )}

        {pays.length > 0 && (
          <Row icon={CreditCard} title="Formas de pagamento">
            <p className="text-sm">{pays.join(" · ")}</p>
          </Row>
        )}

        <Row icon={StoreIcon} title="Contato">
          <div className="flex flex-wrap gap-2">
            {onlyDigits(store.whatsapp).length >= 10 && (
              <a
                href={`https://wa.me/${whatsappNumber(store.whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
              >
                <WhatsIcon className="size-4" /> {formatPhone(store.whatsapp)}
              </a>
            )}
            {store.phone && (
              <a href={`tel:${onlyDigits(store.phone)}`} className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold">
                <Phone className="size-4" /> {store.phone}
              </a>
            )}
            {store.instagram && (
              <a
                href={`https://instagram.com/${store.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold"
              >
                <AtSign className="size-4" /> {store.instagram}
              </a>
            )}
          </div>
        </Row>
      </div>
    </Sheet>
  );
}

function Row({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="mb-1 font-bold">{title}</h4>
        {children}
      </div>
    </div>
  );
}
