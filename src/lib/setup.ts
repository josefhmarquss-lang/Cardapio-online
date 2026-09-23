import crypto from "node:crypto";
import { db } from "./db";
import { createStoreWithOwner, createSuperadmin } from "./repo/platform";

export const DEMO_SLUG = "brasa-e-massa";

/**
 * Garante que existam a pizzaria de demonstração e o superadministrador.
 * Não altera lojas existentes. Se SUPERADMIN_PASSWORD estiver definida,
 * a senha do superadmin passa a ser a da variável.
 */
export function ensureSetup(opts: { log?: (msg: string) => void } = {}) {
  const log = opts.log ?? ((m: string) => console.log(m));
  const d = db();

  if (!d.prepare("SELECT 1 FROM stores WHERE slug = ?").get(DEMO_SLUG)) {
    const email = process.env.DEMO_OWNER_EMAIL || "admin@brasaemassa.demo";
    const password = process.env.DEMO_OWNER_PASSWORD || "pizza1234";
    createStoreWithOwner({
      name: "Brasa & Massa",
      slug: DEMO_SLUG,
      owner_name: "Dono da Brasa & Massa",
      owner_email: email,
      owner_password: password,
      template: "pizzaria",
    });
    log(`✔ Pizzaria de demonstração criada: /${DEMO_SLUG} (painel: ${email})`);
  }

  const hasSuper = d.prepare("SELECT 1 FROM users WHERE role = 'superadmin'").get();
  const envPassword = process.env.SUPERADMIN_PASSWORD;
  if (!hasSuper || envPassword) {
    const email = process.env.SUPERADMIN_EMAIL || "super@cardapio.local";
    const password = envPassword || crypto.randomBytes(9).toString("base64url");
    createSuperadmin(email, "Administrador da plataforma", password);
    if (envPassword) log(`✔ Superadministrador: ${email} (senha definida em SUPERADMIN_PASSWORD)`);
    else log(`✔ Superadministrador criado: ${email} / ${password} — defina SUPERADMIN_PASSWORD para escolher a senha`);
  }
}
