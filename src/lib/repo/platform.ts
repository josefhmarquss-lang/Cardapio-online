import bcrypt from "bcryptjs";
import { db } from "../db";
import { HttpError } from "../errors";
import { DEMO_MENU, DEMO_STORE } from "../demo-data";
import { defaultHours } from "../hours";
import { RESERVED_SLUGS, slugify, updateStore } from "./stores";

export type NewStoreInput = {
  name: string;
  slug?: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
  whatsapp?: string;
  template: "blank" | "pizzaria";
  /** Assinatura: sem isto a loja fica em cobrança manual. */
  billing?: {
    mode: "manual" | "asaas";
    plan: string;
    trial_ends_at?: string | null;
    asaas_customer_id?: string | null;
    asaas_subscription_id?: string | null;
  };
};

/** Confere se o endereço da loja e o e-mail estão livres. Retorna o endereço normalizado. */
export function checkAvailability(nameOrSlug: string, email: string): string {
  const slug = slugify(nameOrSlug);
  if (slug.length < 3) throw new HttpError(400, "Endereço (slug) muito curto.");
  if (RESERVED_SLUGS.has(slug)) throw new HttpError(400, "Este endereço é reservado. Escolha outro.");
  const d = db();
  if (d.prepare("SELECT 1 FROM stores WHERE slug = ?").get(slug)) throw new HttpError(409, "Já existe uma loja com este endereço. Escolha outro.");
  if (d.prepare("SELECT 1 FROM users WHERE email = ?").get(email.trim())) throw new HttpError(409, "Já existe uma conta com este e-mail.");
  return slug;
}

/** Cadastra um estabelecimento e a conta do dono (usado pelo superadmin, pelo seed e pelo cadastro automático). */
export function createStoreWithOwner(input: NewStoreInput): { storeId: number; slug: string } {
  const slug = checkAvailability(input.slug || input.name, input.owner_email);
  const d = db();
  const hash = bcrypt.hashSync(input.owner_password, 12);

  return d.transaction(() => {
    const storeId = Number(
      d.prepare("INSERT INTO stores (slug, name, opening_hours) VALUES (?, ?, ?)").run(slug, input.name.trim(), JSON.stringify(defaultHours()))
        .lastInsertRowid,
    );
    d.prepare("INSERT INTO users (email, name, password_hash, role, store_id) VALUES (?, ?, ?, 'owner', ?)").run(
      input.owner_email.trim().toLowerCase(),
      input.owner_name.trim(),
      hash,
      storeId,
    );
    if (input.template === "pizzaria") {
      updateStore(storeId, { ...DEMO_STORE, name: input.name.trim() });
      seedMenu(storeId);
    } else {
      updateStore(storeId, {
        tagline: "",
        open_mode: "auto",
        delivery_zones: [],
        pix_qr_url: null,
      });
    }
    if (input.whatsapp) updateStore(storeId, { whatsapp: input.whatsapp });
    if (input.billing) {
      const b = input.billing;
      d.prepare(
        `INSERT INTO store_billing (store_id, mode, plan, trial_ends_at, asaas_customer_id, asaas_subscription_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(storeId, b.mode, b.plan, b.trial_ends_at ?? null, b.asaas_customer_id ?? null, b.asaas_subscription_id ?? null);
    }
    return { storeId, slug };
  })();
}

function seedMenu(storeId: number) {
  const d = db();
  const insCat = d.prepare("INSERT INTO categories (store_id, name, description, position) VALUES (?, ?, ?, ?)");
  const insProd = d.prepare(
    `INSERT INTO products (store_id, category_id, name, description, price_cents, image_url, is_available, is_featured, tag, option_groups, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  DEMO_MENU.forEach((cat, ci) => {
    const catId = Number(insCat.run(storeId, cat.name, cat.description, ci).lastInsertRowid);
    cat.products.forEach((p, pi) =>
      insProd.run(
        storeId,
        catId,
        p.name,
        p.description,
        Math.round(p.price * 100),
        p.image,
        p.unavailable ? 0 : 1,
        p.featured ? 1 : 0,
        p.tag ?? "",
        JSON.stringify(p.options ?? []),
        pi,
      ),
    );
  });
}

export function listStoresOverview() {
  return db()
    .prepare(
      `SELECT s.id, s.slug, s.name, s.is_active, s.created_at, s.logo_url, s.primary_color,
              (SELECT email FROM users u WHERE u.store_id = s.id AND u.role = 'owner' ORDER BY u.id LIMIT 1) AS owner_email,
              (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id) AS products,
              (SELECT COUNT(*) FROM orders o WHERE o.store_id = s.id) AS orders,
              COALESCE(b.mode, 'manual') AS billing_mode, COALESCE(b.plan, 'profissional') AS plan,
              b.trial_ends_at, b.paid_until, b.canceled_at
         FROM stores s LEFT JOIN store_billing b ON b.store_id = s.id ORDER BY s.id DESC`,
    )
    .all() as {
    id: number;
    slug: string;
    name: string;
    is_active: number;
    created_at: string;
    logo_url: string | null;
    primary_color: string;
    owner_email: string | null;
    products: number;
    orders: number;
    billing_mode: "manual" | "asaas";
    plan: string;
    trial_ends_at: string | null;
    paid_until: string | null;
    canceled_at: string | null;
  }[];
}

export function setStoreActive(storeId: number, active: boolean) {
  const r = db().prepare("UPDATE stores SET is_active = ? WHERE id = ?").run(active ? 1 : 0, storeId);
  if (!r.changes) throw new HttpError(404, "Loja não encontrada.");
  if (!active)
    db().prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE store_id = ?)").run(storeId);
}

export function resetOwnerPassword(storeId: number, password: string) {
  const hash = bcrypt.hashSync(password, 12);
  const d = db();
  const r = d.prepare("UPDATE users SET password_hash = ? WHERE store_id = ? AND role = 'owner'").run(hash, storeId);
  if (!r.changes) throw new HttpError(404, "Dono da loja não encontrado.");
  d.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE store_id = ?)").run(storeId);
}

export function createSuperadmin(email: string, name: string, password: string) {
  const d = db();
  const hash = bcrypt.hashSync(password, 12);
  const existing = d.prepare("SELECT id, role FROM users WHERE email = ?").get(email) as { id: number; role: string } | undefined;
  if (existing) {
    if (existing.role !== "superadmin") throw new HttpError(409, "E-mail já usado por um dono de loja.");
    d.prepare("UPDATE users SET password_hash = ?, name = ? WHERE id = ?").run(hash, name, existing.id);
    return;
  }
  d.prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'superadmin')").run(email.toLowerCase(), name, hash);
}

// ---------- administradores da plataforma ----------

export function listSuperadmins() {
  return db()
    .prepare("SELECT id, email, name, created_at FROM users WHERE role = 'superadmin' ORDER BY id")
    .all() as { id: number; email: string; name: string; created_at: string }[];
}

/** Cadastro pelo painel: não sobrescreve contas existentes. */
export function addSuperadmin(email: string, name: string, password: string) {
  const d = db();
  if (d.prepare("SELECT 1 FROM users WHERE email = ?").get(email.trim())) throw new HttpError(409, "Já existe uma conta com este e-mail.");
  d.prepare("INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, 'superadmin')").run(
    email.trim().toLowerCase(),
    name.trim(),
    bcrypt.hashSync(password, 12),
  );
}

export function removeSuperadmin(id: number, requesterId: number) {
  if (id === requesterId) throw new HttpError(400, "Você não pode remover a sua própria conta.");
  const d = db();
  const row = d.prepare("SELECT role FROM users WHERE id = ?").get(id) as { role: string } | undefined;
  if (!row || row.role !== "superadmin") throw new HttpError(404, "Administrador não encontrado.");
  // as sessões são apagadas junto (ON DELETE CASCADE)
  d.prepare("DELETE FROM users WHERE id = ? AND role = 'superadmin'").run(id);
}
