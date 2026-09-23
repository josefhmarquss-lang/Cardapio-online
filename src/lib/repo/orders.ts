import crypto from "node:crypto";
import { db } from "../db";
import { HttpError } from "../errors";
import { isOpenNow } from "../hours";
import { money } from "../format";
import type { Fulfillment, Order, OrderItem, OrderItemOption, OrderStatus, PaymentMethod, Store } from "../types";
import { listCategories, listProducts } from "./catalog";

type Row = Record<string, unknown>;

export type NewOrderInput = {
  customer_name: string;
  customer_phone: string;
  fulfillment: Fulfillment;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_reference: string;
  zone_id?: string | null;
  payment_method: PaymentMethod;
  change_for_cents?: number | null;
  notes: string;
  items: { product_id: number; quantity: number; option_ids: string[]; notes: string }[];
};

/**
 * Cria um pedido recalculando TODOS os valores a partir do banco — preços,
 * adicionais e taxa enviados pelo navegador nunca são confiáveis.
 */
export function createOrder(store: Store, input: NewOrderInput): Order {
  if (!store.is_active) throw new HttpError(404, "Estabelecimento não encontrado.");
  if (!isOpenNow(store.opening_hours, store.open_mode, store.timezone))
    throw new HttpError(409, "O estabelecimento está fechado no momento e não está recebendo pedidos.");
  if (input.fulfillment === "delivery" && !store.delivery_enabled) throw new HttpError(400, "Entrega indisponível.");
  if (input.fulfillment === "pickup" && !store.pickup_enabled) throw new HttpError(400, "Retirada indisponível.");
  const payOk = { pix: store.pay_pix, cash: store.pay_cash, card: store.pay_card }[input.payment_method];
  if (!payOk) throw new HttpError(400, "Forma de pagamento indisponível.");
  if (!input.items.length) throw new HttpError(400, "Seu carrinho está vazio.");

  const activeCats = new Set(listCategories(store.id).filter((c) => c.is_active).map((c) => c.id));
  const products = new Map(listProducts(store.id).map((p) => [p.id, p]));

  const items: Omit<OrderItem, "id">[] = input.items.map((it) => {
    const p = products.get(it.product_id);
    if (!p || !activeCats.has(p.category_id)) throw new HttpError(400, "Um dos produtos não existe mais. Atualize a página.");
    if (!p.is_available) throw new HttpError(409, `"${p.name}" está indisponível no momento.`);
    const chosen = new Set(it.option_ids);
    const options: OrderItemOption[] = [];
    let known = 0;
    for (const g of p.option_groups) {
      const picked = g.items.filter((o) => chosen.has(`${g.id}:${o.id}`));
      known += picked.length;
      if (picked.length < g.min) throw new HttpError(400, `Escolha ${g.name.toLowerCase()} para "${p.name}".`);
      if (picked.length > g.max) throw new HttpError(400, `Máximo de ${g.max} em ${g.name} para "${p.name}".`);
      for (const o of picked) options.push({ group: g.name, name: o.name, price_cents: o.price_cents });
    }
    if (known !== chosen.size) throw new HttpError(400, "Opção inválida. Atualize a página.");
    const unit = p.price_cents + options.reduce((s, o) => s + o.price_cents, 0);
    return {
      product_id: p.id,
      name: p.name,
      quantity: it.quantity,
      unit_price_cents: unit,
      total_cents: unit * it.quantity,
      options,
      notes: it.notes,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.total_cents, 0);
  let fee = 0;
  let neighborhood = input.address_neighborhood;
  if (input.fulfillment === "delivery") {
    if (!input.address_street || !input.address_number) throw new HttpError(400, "Informe o endereço de entrega.");
    if (store.delivery_zones.length) {
      const zone = store.delivery_zones.find((z) => z.id === input.zone_id);
      if (!zone) throw new HttpError(400, "Selecione um bairro atendido.");
      fee = zone.fee_cents;
      neighborhood = zone.name;
    } else {
      if (!neighborhood) throw new HttpError(400, "Informe o bairro.");
      fee = store.delivery_fee_cents;
    }
    if (store.min_order_cents && subtotal < store.min_order_cents)
      throw new HttpError(400, `Pedido mínimo para entrega: ${money(store.min_order_cents)}.`);
  }
  const total = subtotal + fee;
  let changeFor: number | null = null;
  if (input.payment_method === "cash" && input.change_for_cents) {
    if (input.change_for_cents < total) throw new HttpError(400, "O valor para troco é menor que o total do pedido.");
    changeFor = input.change_for_cents;
  }
  const delivery = input.fulfillment === "delivery";

  const d = db();
  const orderId = d.transaction(() => {
    const { next_order_number: number } = d
      .prepare("UPDATE stores SET next_order_number = next_order_number + 1 WHERE id = ? RETURNING next_order_number - 1 AS next_order_number")
      .get(store.id) as { next_order_number: number };
    const info = d
      .prepare(
        `INSERT INTO orders (store_id, number, public_token, customer_name, customer_phone, fulfillment,
           address_street, address_number, address_complement, address_neighborhood, address_reference,
           payment_method, change_for_cents, notes, subtotal_cents, delivery_fee_cents, total_cents)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        store.id,
        number,
        crypto.randomBytes(18).toString("base64url"),
        input.customer_name,
        input.customer_phone,
        input.fulfillment,
        delivery ? input.address_street : "",
        delivery ? input.address_number : "",
        delivery ? input.address_complement : "",
        delivery ? neighborhood : "",
        delivery ? input.address_reference : "",
        input.payment_method,
        changeFor,
        input.notes,
        subtotal,
        fee,
        total,
      );
    const oid = Number(info.lastInsertRowid);
    const ins = d.prepare(
      `INSERT INTO order_items (order_id, product_id, name, quantity, unit_price_cents, total_cents, options, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const it of items)
      ins.run(oid, it.product_id, it.name, it.quantity, it.unit_price_cents, it.total_cents, JSON.stringify(it.options), it.notes);
    return oid;
  })();
  return getOrder(store.id, orderId);
}

function hydrate(rows: Row[]): Order[] {
  if (!rows.length) return [];
  const ids = rows.map((r) => Number(r.id));
  const itemRows = db()
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")}) ORDER BY id`)
    .all(...ids) as Row[];
  const byOrder = new Map<number, OrderItem[]>();
  for (const r of itemRows) {
    const list = byOrder.get(Number(r.order_id)) ?? [];
    list.push({
      id: Number(r.id),
      product_id: (r.product_id as number) ?? null,
      name: String(r.name),
      quantity: Number(r.quantity),
      unit_price_cents: Number(r.unit_price_cents),
      total_cents: Number(r.total_cents),
      options: JSON.parse(String(r.options || "[]")),
      notes: String(r.notes || ""),
    });
    byOrder.set(Number(r.order_id), list);
  }
  return rows.map((r) => ({ ...(r as unknown as Order), seen: !!r.seen, items: byOrder.get(Number(r.id)) ?? [] }));
}

export function getOrder(storeId: number, id: number): Order {
  const r = db().prepare("SELECT * FROM orders WHERE id = ? AND store_id = ?").get(id, storeId) as Row | undefined;
  if (!r) throw new HttpError(404, "Pedido não encontrado.");
  return hydrate([r])[0];
}

export function getOrderByToken(token: string): Order | null {
  const r = db().prepare("SELECT * FROM orders WHERE public_token = ?").get(token) as Row | undefined;
  return r ? hydrate([r])[0] : null;
}

export const ACTIVE_STATUSES: OrderStatus[] = ["new", "received", "preparing", "out_for_delivery"];

export function listOrders(
  storeId: number,
  opts: { filter: "active" | "finished" | "all"; limit: number; afterId?: number },
): Order[] {
  let where = "store_id = ?";
  const args: unknown[] = [storeId];
  if (opts.filter === "active") where += ` AND status IN (${ACTIVE_STATUSES.map(() => "?").join(",")})`;
  if (opts.filter === "active") args.push(...ACTIVE_STATUSES);
  if (opts.filter === "finished") where += " AND status IN ('completed','cancelled')";
  if (opts.afterId) {
    where += " AND id > ?";
    args.push(opts.afterId);
  }
  const rows = db()
    .prepare(`SELECT * FROM orders WHERE ${where} ORDER BY id DESC LIMIT ?`)
    .all(...args, opts.limit) as Row[];
  return hydrate(rows);
}

export function updateOrderStatus(storeId: number, id: number, status: OrderStatus): Order {
  getOrder(storeId, id);
  db()
    .prepare(
      "UPDATE orders SET status = ?, seen = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND store_id = ?",
    )
    .run(status, id, storeId);
  return getOrder(storeId, id);
}

export function markOrdersSeen(storeId: number) {
  db().prepare("UPDATE orders SET seen = 1 WHERE store_id = ? AND seen = 0").run(storeId);
}

export function orderPulse(storeId: number) {
  return db()
    .prepare(
      `SELECT COALESCE(MAX(id), 0) AS last_id,
              SUM(CASE WHEN seen = 0 THEN 1 ELSE 0 END) AS unseen,
              SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS awaiting
         FROM orders WHERE store_id = ?`,
    )
    .get(storeId) as { last_id: number; unseen: number | null; awaiting: number | null };
}

export function orderStats(storeId: number, sinceIso: string) {
  return db()
    .prepare(
      `SELECT COUNT(*) AS count,
              COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total_cents END), 0) AS revenue,
              SUM(CASE WHEN status IN ('new','received','preparing','out_for_delivery') THEN 1 ELSE 0 END) AS open
         FROM orders WHERE store_id = ? AND created_at >= ?`,
    )
    .get(storeId, sinceIso) as { count: number; revenue: number; open: number | null };
}
