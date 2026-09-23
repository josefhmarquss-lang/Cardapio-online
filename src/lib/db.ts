import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "./schema";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "cardapio.db");

declare global {
  var __cardapioDb: Database.Database | undefined;
}

function open(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  console.log(`[banco] abrindo ${DB_PATH}`);
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(SCHEMA_SQL);
  return db;
}

/** Conexão única (reaproveitada entre hot-reloads em desenvolvimento). */
export function db(): Database.Database {
  if (!globalThis.__cardapioDb) globalThis.__cardapioDb = open();
  return globalThis.__cardapioDb;
}
