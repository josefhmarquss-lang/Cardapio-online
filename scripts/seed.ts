/**
 * Prepara o banco manualmente (o servidor também faz isso sozinho ao iniciar).
 *
 *   npm run seed                 -> cria o que estiver faltando
 *   npm run seed -- --reset-demo -> apaga e recria a loja de demonstração
 *
 * Variáveis opcionais: SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD
 */
import { db } from "../src/lib/db";
import { DEMO_SLUG, ensureSetup } from "../src/lib/setup";

if (process.argv.includes("--reset-demo")) {
  const row = db().prepare("SELECT id FROM stores WHERE slug = ?").get(DEMO_SLUG) as { id: number } | undefined;
  if (row) {
    db().prepare("DELETE FROM stores WHERE id = ?").run(row.id);
    console.log("Loja de demonstração removida.");
  }
}
ensureSetup();
console.log("Banco pronto.");
