import type { Product } from "@/lib/types";
import type { CartLine } from "./types";

export function lineKey(productId: number, optionIds: string[], notes: string) {
  return `${productId}|${[...optionIds].sort().join(",")}|${notes.trim().toLowerCase()}`;
}

export function unitPrice(p: Product, optionIds: string[]) {
  const ids = new Set(optionIds);
  let extra = 0;
  for (const g of p.option_groups) for (const o of g.items) if (ids.has(`${g.id}:${o.id}`)) extra += o.price_cents;
  return p.price_cents + extra;
}

export function optionLabels(p: Product, optionIds: string[]) {
  const ids = new Set(optionIds);
  const out: string[] = [];
  for (const g of p.option_groups) for (const o of g.items) if (ids.has(`${g.id}:${o.id}`)) out.push(o.name);
  return out;
}

/** Remove do carrinho itens que não existem mais ou ficaram indisponíveis/inválidos. */
export function sanitizeCart(lines: CartLine[], products: Map<number, Product>): CartLine[] {
  return lines.filter((l) => {
    const p = products.get(l.product_id);
    if (!p || !p.is_available) return false;
    const ids = new Set(l.option_ids);
    let known = 0;
    for (const g of p.option_groups) {
      const n = g.items.filter((o) => ids.has(`${g.id}:${o.id}`)).length;
      known += n;
      if (n < g.min || n > g.max) return false;
    }
    return known === ids.size && l.quantity > 0;
  });
}

export function minPrice(p: Product) {
  let extra = 0;
  for (const g of p.option_groups) {
    if (g.min > 0) {
      const sorted = [...g.items].sort((a, b) => a.price_cents - b.price_cents);
      extra += sorted.slice(0, g.min).reduce((s, o) => s + o.price_cents, 0);
    }
  }
  return p.price_cents + extra;
}

export function hasPriceVariation(p: Product) {
  return p.option_groups.some((g) => g.items.some((o) => o.price_cents > 0));
}
