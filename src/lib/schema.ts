/**
 * Esquema do banco (SQLite). Todas as tabelas de conteúdo têm `store_id`:
 * cada consulta do painel filtra pelo estabelecimento da sessão autenticada.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS stores (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                 TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  tagline              TEXT NOT NULL DEFAULT '',
  about                TEXT NOT NULL DEFAULT '',
  logo_url             TEXT,
  banner_url           TEXT,
  primary_color        TEXT NOT NULL DEFAULT '#C0392B',
  accent_color         TEXT NOT NULL DEFAULT '#F4B942',
  background_color     TEXT NOT NULL DEFAULT '#FFF8F1',
  font_style           TEXT NOT NULL DEFAULT 'modern',
  whatsapp             TEXT NOT NULL DEFAULT '',
  phone                TEXT NOT NULL DEFAULT '',
  instagram            TEXT NOT NULL DEFAULT '',
  address_street       TEXT NOT NULL DEFAULT '',
  address_number       TEXT NOT NULL DEFAULT '',
  address_complement   TEXT NOT NULL DEFAULT '',
  address_neighborhood TEXT NOT NULL DEFAULT '',
  address_city         TEXT NOT NULL DEFAULT '',
  address_state        TEXT NOT NULL DEFAULT '',
  address_zip          TEXT NOT NULL DEFAULT '',
  opening_hours        TEXT NOT NULL DEFAULT '[]',
  open_mode            TEXT NOT NULL DEFAULT 'auto',
  timezone             TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  delivery_enabled     INTEGER NOT NULL DEFAULT 1,
  pickup_enabled       INTEGER NOT NULL DEFAULT 1,
  delivery_fee_cents   INTEGER NOT NULL DEFAULT 0,
  delivery_zones       TEXT NOT NULL DEFAULT '[]',
  min_order_cents      INTEGER NOT NULL DEFAULT 0,
  delivery_time        TEXT NOT NULL DEFAULT '',
  pickup_time          TEXT NOT NULL DEFAULT '',
  delivery_info        TEXT NOT NULL DEFAULT '',
  pay_pix              INTEGER NOT NULL DEFAULT 1,
  pay_cash             INTEGER NOT NULL DEFAULT 1,
  pay_card             INTEGER NOT NULL DEFAULT 1,
  pix_key              TEXT NOT NULL DEFAULT '',
  pix_key_type         TEXT NOT NULL DEFAULT '',
  pix_receiver_name    TEXT NOT NULL DEFAULT '',
  pix_qr_url           TEXT,
  payment_instructions TEXT NOT NULL DEFAULT '',
  sound_enabled        INTEGER NOT NULL DEFAULT 1,
  is_active            INTEGER NOT NULL DEFAULT 1,
  next_order_number    INTEGER NOT NULL DEFAULT 1,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner','superadmin')),
  store_id      INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK ((role = 'owner' AND store_id IS NOT NULL) OR (role = 'superadmin' AND store_id IS NULL))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id    INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id, position);

CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id      INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id   INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price_cents   INTEGER NOT NULL DEFAULT 0,
  image_url     TEXT,
  is_available  INTEGER NOT NULL DEFAULT 1,
  is_featured   INTEGER NOT NULL DEFAULT 0,
  tag           TEXT NOT NULL DEFAULT '',
  option_groups TEXT NOT NULL DEFAULT '[]',
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id, category_id, position);

CREATE TABLE IF NOT EXISTS orders (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id            INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  number              INTEGER NOT NULL,
  public_token        TEXT NOT NULL UNIQUE,
  status              TEXT NOT NULL DEFAULT 'new',
  customer_name       TEXT NOT NULL,
  customer_phone      TEXT NOT NULL DEFAULT '',
  fulfillment         TEXT NOT NULL CHECK (fulfillment IN ('delivery','pickup')),
  address_street      TEXT NOT NULL DEFAULT '',
  address_number      TEXT NOT NULL DEFAULT '',
  address_complement  TEXT NOT NULL DEFAULT '',
  address_neighborhood TEXT NOT NULL DEFAULT '',
  address_reference   TEXT NOT NULL DEFAULT '',
  payment_method      TEXT NOT NULL CHECK (payment_method IN ('pix','cash','card')),
  change_for_cents    INTEGER,
  notes               TEXT NOT NULL DEFAULT '',
  subtotal_cents      INTEGER NOT NULL,
  delivery_fee_cents  INTEGER NOT NULL DEFAULT 0,
  total_cents         INTEGER NOT NULL,
  seen                INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (store_id, number)
);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id, id DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       INTEGER,
  name             TEXT NOT NULL,
  quantity         INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  total_cents      INTEGER NOT NULL,
  options          TEXT NOT NULL DEFAULT '[]',
  notes            TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS images (
  id         TEXT PRIMARY KEY,
  store_id   INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  mime       TEXT NOT NULL,
  data       BLOB NOT NULL,
  size       INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_images_store ON images(store_id);
`;
