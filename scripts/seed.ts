/**
 * Prepara o banco: cria a pizzaria de demonstração e a conta de superadministrador.
 *
 *   npm run seed                 -> cria o que estiver faltando
 *   npm run seed -- --reset-demo -> apaga e recria a loja de demonstração
 *
 * Variáveis opcionais: SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD
 */
import crypto from "node:crypto";
import { db } from "../src/lib/db";
import { createStoreWithOwner, createSuperadmin } from "../src/lib/repo/platform";

const DEMO_SLUG = "brasa-e-massa";
const demoEmail = process.env.DEMO_OWNER_EMAIL || "admin@brasaemassa.demo";
const demoPassword = process.env.DEMO_OWNER_PASSWORD || "pizza1234";

const d = db();
const reset = process.argv.includes("--reset-demo");

if (reset) {
  const row = d.prepare("SELECT id FROM stores WHERE slug = ?").get(DEMO_SLUG) as { id: number } | undefined;
  if (row) {
    d.prepare("DELETE FROM stores WHERE id = ?").run(row.id);
    console.log("Loja de demonstração removida.");
  }
}

if (!d.prepare("SELECT 1 FROM stores WHERE slug = ?").get(DEMO_SLUG)) {
  createStoreWithOwner({
    name: "Brasa & Massa",
    slug: DEMO_SLUG,
    owner_name: "Dono da Brasa & Massa",
    owner_email: demoEmail,
    owner_password: demoPassword,
    template: "pizzaria",
  });
  console.log(`✔ Pizzaria de demonstração criada: /${DEMO_SLUG}`);
  console.log(`  Painel: ${demoEmail}${process.env.DEMO_OWNER_PASSWORD ? "" : ` / ${demoPassword}`}`);
} else {
  console.log(`• Pizzaria de demonstração já existe (/${DEMO_SLUG}).`);
}

const hasSuper = d.prepare("SELECT 1 FROM users WHERE role = 'superadmin'").get();
if (!hasSuper || process.env.SUPERADMIN_PASSWORD) {
  const email = process.env.SUPERADMIN_EMAIL || "super@cardapio.local";
  const password = process.env.SUPERADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
  createSuperadmin(email, "Administrador da plataforma", password);
  if (process.env.SUPERADMIN_PASSWORD) {
    console.log(`✔ Superadministrador: ${email} (senha definida em SUPERADMIN_PASSWORD)`);
  } else {
    console.log(`✔ Superadministrador: ${email} / ${password}`);
    console.log("  (senha gerada aleatoriamente — anote agora, ela não será exibida de novo)");
  }
} else {
  console.log("• Superadministrador já existe (defina SUPERADMIN_PASSWORD para redefinir).");
}
