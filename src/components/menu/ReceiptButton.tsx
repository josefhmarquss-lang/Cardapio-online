"use client";

import { Receipt } from "lucide-react";
import { money, onlyDigits } from "@/lib/format";
import { buildReceiptMessage, whatsappLink } from "@/lib/order-message";
import type { Order } from "@/lib/types";
import { WhatsIcon } from "./CartSheet";

/** Depois do Pix: abre o WhatsApp da loja com a mensagem do comprovante pronta. */
export function ReceiptButton({ store, order }: { store: { name: string; whatsapp: string }; order: Order }) {
  if (onlyDigits(store.whatsapp).length < 10) return null;
  return (
    <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-4">
      <div className="flex items-center gap-2 font-bold text-stone-900">
        <Receipt className="size-5 text-emerald-600" /> Depois de pagar, envie o comprovante
      </div>
      <p className="mt-1 text-sm text-stone-600">
        Toque no botão, anexe o print do comprovante de {money(order.total_cents)} na conversa e envie. A loja confere e confirma o seu pedido.
      </p>
      <a
        href={whatsappLink(store.whatsapp, buildReceiptMessage(store.name, order))}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-[#1fbe5b]"
      >
        <WhatsIcon /> Já paguei — enviar comprovante
      </a>
    </div>
  );
}
