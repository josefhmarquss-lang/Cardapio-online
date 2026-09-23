import { ensureSetup } from "./setup";

console.log(`[inicio] Node ${process.version} — banco em ${process.env.DATABASE_PATH || "./data/cardapio.db"}`);
try {
  ensureSetup({ log: (m) => console.log(`[inicio] ${m}`) });
  console.log("[inicio] banco pronto");
} catch (e) {
  console.error("[inicio] ERRO ao preparar o banco:", e);
  throw e;
}
