import { db } from "../db";
import type { Store } from "../types";

const BOOL_FIELDS = [
  "delivery_enabled",
  "pickup_enabled",
  "pay_pix",
  "pay_cash",
  "pay_card",
  "sound_enabled",
  "is_active",
] as const;
const JSON_FIELDS = ["opening_hours", "delivery_zones"] as const;

type Row = Record<string, unknown>;

export function rowToStore(r: Row): Store {
  const s = { ...r } as Row;
  for (const f of BOOL_FIELDS) s[f] = !!s[f];
  for (const f of JSON_FIELDS) {
    try {
      s[f] = JSON.parse(String(s[f] ?? "[]"));
    } catch {
      s[f] = [];
    }
  }
  delete s.next_order_number;
  return s as unknown as Store;
}

export function getStoreById(id: number): Store | null {
  const r = db().prepare("SELECT * FROM stores WHERE id = ?").get(id) as Row | undefined;
  return r ? rowToStore(r) : null;
}

export function getStoreBySlug(slug: string): Store | null {
  const r = db().prepare("SELECT * FROM stores WHERE slug = ?").get(slug) as Row | undefined;
  return r ? rowToStore(r) : null;
}

/** Campos que o dono da loja pode alterar pelo painel. */
export const EDITABLE_STORE_FIELDS = [
  "name",
  "tagline",
  "about",
  "logo_url",
  "banner_url",
  "primary_color",
  "accent_color",
  "background_color",
  "font_style",
  "whatsapp",
  "phone",
  "instagram",
  "address_street",
  "address_number",
  "address_complement",
  "address_neighborhood",
  "address_city",
  "address_state",
  "address_zip",
  "opening_hours",
  "open_mode",
  "delivery_enabled",
  "pickup_enabled",
  "delivery_fee_cents",
  "delivery_zones",
  "min_order_cents",
  "delivery_time",
  "pickup_time",
  "delivery_info",
  "pay_pix",
  "pay_cash",
  "pay_card",
  "pix_key",
  "pix_key_type",
  "pix_receiver_name",
  "pix_qr_url",
  "payment_instructions",
  "sound_enabled",
] as const;

export type StorePatch = Partial<Pick<Store, (typeof EDITABLE_STORE_FIELDS)[number]>>;

export function updateStore(storeId: number, patch: StorePatch): Store {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of EDITABLE_STORE_FIELDS) {
    if (!(key in patch)) continue;
    let v = patch[key] as unknown;
    if (typeof v === "boolean") v = v ? 1 : 0;
    else if (Array.isArray(v)) v = JSON.stringify(v);
    sets.push(`${key} = ?`);
    values.push(v);
  }
  if (sets.length) {
    sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
    db()
      .prepare(`UPDATE stores SET ${sets.join(", ")} WHERE id = ?`)
      .run(...values, storeId);
  }
  return getStoreById(storeId)!;
}

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "super",
  "login",
  "logout",
  "demo",
  "_next",
  "static",
  "public",
  "uploads",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "pedido",
  "assets",
  "assinar",
  "assinatura",
  "cadastro",
  "entrar",
  "planos",
]);

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
