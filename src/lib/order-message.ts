import { money, PAYMENT_LABEL, whatsappNumber } from "./format";
import type { Order } from "./types";

/** Monta o texto do pedido para enviar pelo WhatsApp do estabelecimento. */
export function buildWhatsappMessage(storeName: string, order: Order, trackUrl?: string): string {
  const L: string[] = [];
  L.push(`*Novo pedido #${order.number} — ${storeName}*`);
  L.push("");
  for (const it of order.items) {
    L.push(`*${it.quantity}x ${it.name}* — ${money(it.total_cents)}`);
    for (const o of it.options) {
      L.push(`   • ${o.group}: ${o.name}${o.price_cents ? ` (+${money(o.price_cents)})` : ""}`);
    }
    if (it.notes) L.push(`   _Obs.: ${it.notes}_`);
  }
  L.push("");
  L.push(`Subtotal: ${money(order.subtotal_cents)}`);
  if (order.fulfillment === "delivery") {
    L.push(`Taxa de entrega: ${order.delivery_fee_cents ? money(order.delivery_fee_cents) : "grátis"}`);
  }
  L.push(`*Total: ${money(order.total_cents)}*`);
  L.push("");
  L.push(`*Cliente:* ${order.customer_name}`);
  if (order.customer_phone) L.push(`*Telefone:* ${order.customer_phone}`);
  if (order.fulfillment === "delivery") {
    L.push(`*Entrega em:* ${order.address_street}, ${order.address_number}${order.address_complement ? ` — ${order.address_complement}` : ""}`);
    L.push(`*Bairro:* ${order.address_neighborhood}`);
    if (order.address_reference) L.push(`*Referência:* ${order.address_reference}`);
  } else {
    L.push(`*Retirada no local*`);
  }
  let pay = `*Pagamento:* ${PAYMENT_LABEL[order.payment_method]}`;
  if (order.payment_method === "cash" && order.change_for_cents) pay += ` — troco para ${money(order.change_for_cents)}`;
  L.push(pay);
  if (order.payment_method === "pix") L.push("_Vou enviar o comprovante do Pix logo em seguida nesta conversa._");
  if (order.notes) L.push(`*Observações:* ${order.notes}`);
  if (trackUrl) {
    L.push("");
    L.push(`Acompanhar pedido: ${trackUrl}`);
  }
  L.push("");
  L.push("Aguardo a confirmação do pedido. Obrigado!");
  return L.join("\n");
}

/** Mensagem que acompanha o comprovante do Pix (o cliente anexa o print na conversa). */
export function buildReceiptMessage(storeName: string, order: Order): string {
  return [
    `Olá, ${storeName}! Segue o *comprovante do Pix* do pedido *#${order.number}*.`,
    `Valor pago: *${money(order.total_cents)}*`,
    `Cliente: ${order.customer_name}`,
    "",
    "📎 (comprovante em anexo)",
  ].join("\n");
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(text)}`;
}
