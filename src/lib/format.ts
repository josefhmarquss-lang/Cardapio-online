import type { OrderStatus, PaymentMethod, Fulfillment } from "./types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function money(cents: number): string {
  return brl.format((cents || 0) / 100);
}

/** "12,50" | "12.5" | "R$ 1.234,56" -> centavos */
export function parseMoney(input: string): number {
  const clean = String(input).replace(/[^\d,.-]/g, "");
  if (!clean) return 0;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function centsToInput(cents: number): string {
  return ((cents || 0) / 100).toFixed(2).replace(".", ",");
}

export function onlyDigits(s: string): string {
  return String(s || "").replace(/\D/g, "");
}

/** Número para wa.me: somente dígitos, com DDI 55 quando faltar. */
export function whatsappNumber(raw: string): string {
  const d = onlyDigits(raw);
  if (!d) return "";
  return d.length <= 11 ? `55${d}` : d;
}

export function formatPhone(raw: string): string {
  let d = onlyDigits(raw);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Novo — aguardando confirmação",
  received: "Recebido",
  preparing: "Em preparação",
  out_for_delivery: "Saiu para entrega",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export function statusLabel(status: OrderStatus, fulfillment: Fulfillment): string {
  if (status === "out_for_delivery" && fulfillment === "pickup") return "Pronto para retirada";
  return STATUS_LABEL[status];
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  card: "Cartão (na entrega/retirada)",
};

export const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  delivery: "Entrega",
  pickup: "Retirada no local",
};

export function formatDateTime(iso: string, timeZone = "America/Sao_Paulo"): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string, timeZone = "America/Sao_Paulo"): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit" });
}

export function storeAddress(s: {
  address_street: string;
  address_number: string;
  address_complement?: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
}): string {
  const line1 = [s.address_street, s.address_number].filter(Boolean).join(", ");
  const parts = [line1, s.address_complement, s.address_neighborhood].filter(Boolean).join(" — ");
  const city = [s.address_city, s.address_state].filter(Boolean).join("/");
  return [parts, city].filter(Boolean).join(" · ");
}
