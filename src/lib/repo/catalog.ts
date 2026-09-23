import { db } from "../db";
import { HttpError } from "../errors";
import type { Category, OptionGroup, Product } from "../types";

type Row = Record<string, unknown>;

function rowToCategory(r: Row): Category {
  return { ...(r as unknown as Category), is_active: !!r.is_active };
}

function rowToProduct(r: Row): Product {
  let groups: OptionGroup[] = [];
  try {
    groups = JSON.parse(String(r.option_groups || "[]"));
  } catch {}
  return {
    ...(r as unknown as Product),
    is_available: !!r.is_available,
    is_featured: !!r.is_featured,
    option_groups: groups,
  };
}

// ---------- categorias ----------

export function listCategories(storeId: number): Category[] {
  return (db().prepare("SELECT * FROM categories WHERE store_id = ? ORDER BY position, id").all(storeId) as Row[]).map(
    rowToCategory,
  );
}

export function getCategory(storeId: number, id: number): Category {
  const r = db().prepare("SELECT * FROM categories WHERE id = ? AND store_id = ?").get(id, storeId) as Row | undefined;
  if (!r) throw new HttpError(404, "Categoria não encontrada.");
  return rowToCategory(r);
}

export function createCategory(storeId: number, data: { name: string; description: string; is_active: boolean }): Category {
  const d = db();
  const { pos } = d.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM categories WHERE store_id = ?").get(storeId) as {
    pos: number;
  };
  const info = d
    .prepare("INSERT INTO categories (store_id, name, description, is_active, position) VALUES (?, ?, ?, ?, ?)")
    .run(storeId, data.name, data.description, data.is_active ? 1 : 0, pos);
  return getCategory(storeId, Number(info.lastInsertRowid));
}

export function updateCategory(
  storeId: number,
  id: number,
  data: { name: string; description: string; is_active: boolean },
): Category {
  getCategory(storeId, id);
  db()
    .prepare("UPDATE categories SET name = ?, description = ?, is_active = ? WHERE id = ? AND store_id = ?")
    .run(data.name, data.description, data.is_active ? 1 : 0, id, storeId);
  return getCategory(storeId, id);
}

export function deleteCategory(storeId: number, id: number) {
  getCategory(storeId, id);
  const { n } = db().prepare("SELECT COUNT(*) AS n FROM products WHERE category_id = ? AND store_id = ?").get(id, storeId) as {
    n: number;
  };
  if (n > 0) throw new HttpError(409, `Esta categoria tem ${n} produto(s). Mova ou exclua os produtos antes.`);
  db().prepare("DELETE FROM categories WHERE id = ? AND store_id = ?").run(id, storeId);
}

/** Reordena itens garantindo que todos os IDs pertencem à loja. */
function reorder(table: "categories" | "products", storeId: number, ids: number[]) {
  const d = db();
  const owned = new Set(
    (d.prepare(`SELECT id FROM ${table} WHERE store_id = ?`).all(storeId) as { id: number }[]).map((r) => r.id),
  );
  if (ids.some((id) => !owned.has(id))) throw new HttpError(403, "Item de outra loja.");
  const stmt = d.prepare(`UPDATE ${table} SET position = ? WHERE id = ? AND store_id = ?`);
  d.transaction(() => ids.forEach((id, i) => stmt.run(i, id, storeId)))();
}

export const reorderCategories = (storeId: number, ids: number[]) => reorder("categories", storeId, ids);
export const reorderProducts = (storeId: number, ids: number[]) => reorder("products", storeId, ids);

// ---------- produtos ----------

export function listProducts(storeId: number): Product[] {
  return (
    db().prepare("SELECT * FROM products WHERE store_id = ? ORDER BY category_id, position, id").all(storeId) as Row[]
  ).map(rowToProduct);
}

export function getProduct(storeId: number, id: number): Product {
  const r = db().prepare("SELECT * FROM products WHERE id = ? AND store_id = ?").get(id, storeId) as Row | undefined;
  if (!r) throw new HttpError(404, "Produto não encontrado.");
  return rowToProduct(r);
}

export type ProductInput = {
  category_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  tag: string;
  option_groups: OptionGroup[];
};

export function createProduct(storeId: number, p: ProductInput): Product {
  getCategory(storeId, p.category_id); // a categoria precisa ser desta loja
  const d = db();
  const { pos } = d
    .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM products WHERE store_id = ? AND category_id = ?")
    .get(storeId, p.category_id) as { pos: number };
  const info = d
    .prepare(
      `INSERT INTO products (store_id, category_id, name, description, price_cents, image_url, is_available, is_featured, tag, option_groups, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      storeId,
      p.category_id,
      p.name,
      p.description,
      p.price_cents,
      p.image_url,
      p.is_available ? 1 : 0,
      p.is_featured ? 1 : 0,
      p.tag,
      JSON.stringify(p.option_groups),
      pos,
    );
  return getProduct(storeId, Number(info.lastInsertRowid));
}

export function updateProduct(storeId: number, id: number, p: ProductInput): Product {
  const current = getProduct(storeId, id);
  getCategory(storeId, p.category_id);
  let position = current.position;
  if (current.category_id !== p.category_id) {
    position = (
      db()
        .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM products WHERE store_id = ? AND category_id = ?")
        .get(storeId, p.category_id) as { pos: number }
    ).pos;
  }
  db()
    .prepare(
      `UPDATE products SET category_id = ?, name = ?, description = ?, price_cents = ?, image_url = ?, is_available = ?,
              is_featured = ?, tag = ?, option_groups = ?, position = ?
        WHERE id = ? AND store_id = ?`,
    )
    .run(
      p.category_id,
      p.name,
      p.description,
      p.price_cents,
      p.image_url,
      p.is_available ? 1 : 0,
      p.is_featured ? 1 : 0,
      p.tag,
      JSON.stringify(p.option_groups),
      position,
      id,
      storeId,
    );
  return getProduct(storeId, id);
}

export function setProductAvailability(storeId: number, id: number, available: boolean): Product {
  getProduct(storeId, id);
  db().prepare("UPDATE products SET is_available = ? WHERE id = ? AND store_id = ?").run(available ? 1 : 0, id, storeId);
  return getProduct(storeId, id);
}

export function deleteProduct(storeId: number, id: number) {
  getProduct(storeId, id);
  db().prepare("DELETE FROM products WHERE id = ? AND store_id = ?").run(id, storeId);
}

/** Cardápio público: só categorias ativas, com seus produtos. */
export function getPublicMenu(storeId: number) {
  const cats = listCategories(storeId).filter((c) => c.is_active);
  const prods = listProducts(storeId);
  return cats
    .map((c) => ({ ...c, products: prods.filter((p) => p.category_id === c.id) }))
    .filter((c) => c.products.length > 0);
}
