import { z } from "zod";
import { db } from "./db";
import { HEX_RE } from "./colors";

const text = (max: number) => z.string().trim().max(max);
const cents = z.number().int().min(0).max(100_000_00);
const shortId = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);

/**
 * Imagens aceitas: enviadas pela própria loja (/api/images/<id>) ou do kit de
 * demonstração (/demo/...). Evita apontar para arquivos de outra loja ou URLs arbitrárias.
 */
export function imageUrl(storeId: number) {
  return z
    .string()
    .nullable()
    .refine((v) => {
      if (v === null || v === "") return true;
      if (/^\/demo\/[a-z0-9-]+\.(svg|png|jpg|webp)$/.test(v)) return true;
      const m = v.match(/^\/api\/images\/([a-f0-9]{32})$/);
      if (!m) return false;
      return !!db().prepare("SELECT 1 FROM images WHERE id = ? AND store_id = ?").get(m[1], storeId);
    }, "imagem inválida")
    .transform((v) => v || null);
}

const hours = z
  .array(
    z.object({
      day: z.number().int().min(0).max(6),
      open: z.string().regex(/^\d{2}:\d{2}$/),
      close: z.string().regex(/^\d{2}:\d{2}$/),
      closed: z.boolean(),
    }),
  )
  .max(7);

export function storePatchSchema(storeId: number) {
  return z
    .object({
      name: text(80).min(2, "informe o nome"),
      tagline: text(140),
      about: text(1000),
      logo_url: imageUrl(storeId),
      banner_url: imageUrl(storeId),
      primary_color: z.string().regex(HEX_RE),
      accent_color: z.string().regex(HEX_RE),
      background_color: z.string().regex(HEX_RE),
      font_style: z.enum(["modern", "classic", "rustic"]),
      whatsapp: z.string().trim().regex(/^[\d\s()+-]{0,20}$/, "número inválido"),
      phone: text(30),
      instagram: text(60),
      address_street: text(120),
      address_number: text(20),
      address_complement: text(80),
      address_neighborhood: text(80),
      address_city: text(80),
      address_state: text(30),
      address_zip: text(12),
      opening_hours: hours,
      open_mode: z.enum(["auto", "open", "closed"]),
      delivery_enabled: z.boolean(),
      pickup_enabled: z.boolean(),
      delivery_fee_cents: cents,
      delivery_zones: z.array(z.object({ id: shortId, name: text(80).min(1), fee_cents: cents })).max(200),
      min_order_cents: cents,
      delivery_time: text(40),
      pickup_time: text(40),
      delivery_info: text(600),
      pay_pix: z.boolean(),
      pay_cash: z.boolean(),
      pay_card: z.boolean(),
      pix_key: text(120),
      pix_key_type: text(20),
      pix_receiver_name: text(80),
      pix_qr_url: imageUrl(storeId),
      payment_instructions: text(600),
      sound_enabled: z.boolean(),
    })
    .partial()
    .strict();
}

export const categorySchema = z.object({
  name: text(60).min(1, "informe o nome"),
  description: text(200).default(""),
  is_active: z.boolean().default(true),
});

const optionGroup = z
  .object({
    id: shortId,
    name: text(60).min(1, "nome do grupo"),
    min: z.number().int().min(0).max(20),
    max: z.number().int().min(1).max(20),
    items: z.array(z.object({ id: shortId, name: text(60).min(1, "nome da opção"), price_cents: cents })).min(1).max(40),
  })
  .refine((g) => g.min <= g.max, "mínimo maior que máximo")
  .refine((g) => g.min <= g.items.length, "mínimo maior que a quantidade de opções");

export function productSchema(storeId: number) {
  return z.object({
    category_id: z.number().int().positive(),
    name: text(80).min(1, "informe o nome"),
    description: text(500).default(""),
    price_cents: cents,
    image_url: imageUrl(storeId),
    is_available: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    tag: text(24).default(""),
    option_groups: z.array(optionGroup).max(10).default([]).refine(assertUniqueOptionIds, "opções com identificadores repetidos"),
  });
}

export const orderSchema = z.object({
  customer_name: text(80).min(2, "informe seu nome"),
  customer_phone: z.string().trim().regex(/^[\d\s()+-]{0,20}$/, "telefone inválido").default(""),
  fulfillment: z.enum(["delivery", "pickup"]),
  address_street: text(120).default(""),
  address_number: text(20).default(""),
  address_complement: text(80).default(""),
  address_neighborhood: text(80).default(""),
  address_reference: text(120).default(""),
  zone_id: shortId.nullable().optional(),
  payment_method: z.enum(["pix", "cash", "card"]),
  change_for_cents: cents.nullable().optional(),
  notes: text(300).default(""),
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().min(1).max(50),
        option_ids: z.array(z.string().regex(/^[A-Za-z0-9_-]{1,40}:[A-Za-z0-9_-]{1,40}$/)).max(60).default([]),
        notes: text(200).default(""),
      }),
    )
    .min(1, "carrinho vazio")
    .max(60),
});

export const passwordSchema = z.string().min(8, "a senha deve ter pelo menos 8 caracteres").max(128);

/** IDs de grupos únicos no produto e de itens únicos em cada grupo. */
export function assertUniqueOptionIds(groups: { id: string; items: { id: string }[] }[]) {
  const gids = new Set<string>();
  for (const g of groups) {
    if (gids.has(g.id)) return false;
    gids.add(g.id);
    const iids = new Set(g.items.map((i) => i.id));
    if (iids.size !== g.items.length) return false;
  }
  return true;
}
