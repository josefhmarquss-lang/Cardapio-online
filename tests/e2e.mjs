/**
 * Teste de ponta a ponta do fluxo completo (servidor precisa estar rodando).
 *   BASE_URL=http://localhost:3000 SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... npm run test:e2e
 * Usa a loja de demonstração (npm run seed) e cria a loja "lanchonete-teste" para testar o isolamento.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
const SP = fs.mkdtempSync(path.join(os.tmpdir(), "cardapio-e2e-"));
const BASE = process.env.BASE_URL || "http://localhost:3000";
const SUPER_EMAIL = process.env.SUPERADMIN_EMAIL || "super@cardapio.local";
const SUPER_PASS = process.env.SUPERADMIN_PASSWORD || "super12345";
const DEMO_EMAIL = process.env.DEMO_OWNER_EMAIL || "admin@brasaemassa.demo";
const DEMO_PASS = process.env.DEMO_OWNER_PASSWORD || "pizza1234";
const NUM = String(1000 + Math.floor(Math.random()*8999));
const log = (...a) => console.log("•", ...a);
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
// imagens de teste geradas na hora (PNG)
{
  const p = await b.newPage({ viewport: { width: 600, height: 600 } });
  await p.goto("file://" + path.resolve("public/demo/pizza-margherita.svg"));
  await p.screenshot({ path: SP + "/f1-product.png" });
  await p.setViewportSize({ width: 1600, height: 600 });
  await p.goto("file://" + path.resolve("public/demo/banner-pizzaria.svg"));
  await p.screenshot({ path: SP + "/d1.png" });
  await p.close();
}
const errors = [];
function watch(p, tag) {
  p.on("pageerror", (e) => errors.push(`${tag} pageerror: ${e.message}`));
  p.on("console", (m) => m.type() === "error" && !m.text().includes("401") && errors.push(`${tag} console: ${m.text()}`));
}

// ---------- 1) superadmin cadastra um novo estabelecimento ----------
const superCtx = await b.newContext({ viewport: { width: 1280, height: 860 } });
const sp = await superCtx.newPage(); watch(sp, "super");
await sp.goto(BASE + "/admin/login");
await sp.fill("#email", SUPER_EMAIL);
await sp.fill("#password", SUPER_PASS);
await sp.click("button:has-text('Entrar')");
await sp.waitForURL("**/super");
await sp.fill("input[placeholder='Ex.: Lanchonete do Zé']", "Lanchonete Teste");
const inputs = sp.locator("form input");
await sp.locator("label:has-text('WhatsApp da loja') + input").fill("(21) 97777-6666");
await sp.locator("label:has-text('Nome do responsável') + input").fill("Zé Teste");
await sp.locator("label:has-text('E-mail de acesso') + input").fill("ze@lanchonete.teste");
await sp.locator("label:has-text('Senha inicial') + input").fill("lanche1234");
if (!(await sp.getByText("/lanchonete-teste").count())) await sp.click("button:has-text('Cadastrar loja')");
await sp.waitForSelector("text=/lanchonete-teste");
await sp.screenshot({ path: SP + "/e-super.png" });
log("superadmin criou /lanchonete-teste");

// ---------- 2) dono da pizzaria entra no painel ----------
const ownerCtx = await b.newContext({ viewport: { width: 1280, height: 860 } });
const op = await ownerCtx.newPage(); watch(op, "owner");
await op.goto(BASE + "/admin");
await op.waitForURL("**/admin/login");
log("painel sem login redireciona para /admin/login");
await op.fill("#email", DEMO_EMAIL);
await op.fill("#password", "senha-errada");
await op.click("button:has-text('Entrar')");
await op.waitForSelector("text=E-mail ou senha incorretos");
log("senha errada recusada");
await op.fill("#password", DEMO_PASS);
await op.click("button:has-text('Entrar')");
await op.waitForURL(BASE + "/admin");
await op.screenshot({ path: SP + "/e-orders.png" });
log("login ok");

// aparência: troca logo e banner por upload
await op.goto(BASE + "/admin/aparencia", { waitUntil: "networkidle" });
const files = op.locator("input[type=file]");
await files.nth(0).setInputFiles(SP + "/f1-product.png");
await op.waitForFunction(() => document.querySelectorAll("img[src^='/api/images/']").length >= 1);
await files.nth(1).setInputFiles(SP + "/d1.png");
await op.waitForFunction(() => document.querySelectorAll("img[src^='/api/images/']").length >= 3);
await op.click(Math.random() > .5 ? "text=Verde italiano" : "text=Oceano");
await op.click("button:has-text('Salvar alterações')");
await op.waitForSelector("text=Alterações salvas");
await op.screenshot({ path: SP + "/e-appearance.png" });
log("logo, banner e cores salvos");

// loja: endereço e whatsapp
await op.goto(BASE + "/admin/loja", { waitUntil: "networkidle" });
await op.locator("label:has-text('Rua / avenida') + input").fill("Avenida Paulista");
await op.locator("label:has-text('Número') + input").fill(NUM);
await op.locator("label:has-text('WhatsApp para pedidos') + input").fill("(11) 91234-5678");
await op.click("button:has-text('Salvar alterações')");
await op.waitForSelector("text=Alterações salvas");
await op.screenshot({ path: SP + "/e-store.png", fullPage: true });
log("endereço e WhatsApp salvos");

// produto novo com foto e preço
await op.goto(BASE + "/admin/produtos", { waitUntil: "networkidle" });
await op.click("button:has-text('Novo produto')");
await op.fill("input[placeholder='Ex.: Pizza Margherita']", "Pizza Teste da Casa");
await op.fill("textarea[placeholder^='Ingredientes']", "Molho, muçarela e manjericão fresco.");
await op.locator("label:has-text('Preço') + div input").fill("3990");
await op.locator("[role=dialog] input[type=file]").setInputFiles(SP + "/f1-product.png");
await op.waitForSelector("[role=dialog] img[src^='/api/images/']");
await op.click("button:has-text('Tamanhos')");
await op.screenshot({ path: SP + "/e-product-editor.png" });
await op.click("button:has-text('Salvar produto')");
await op.waitForSelector("text=Produto cadastrado");
await op.screenshot({ path: SP + "/e-products.png" });
log("produto cadastrado");

// ---------- 3) cardápio público reflete as alterações ----------
const custCtx = await b.newContext({ viewport: { width: 390, height: 844 } });
const cp = await custCtx.newPage(); watch(cp, "cliente");
await cp.goto(BASE + "/brasa-e-massa", { waitUntil: "networkidle" });
const html = await cp.content();
for (const t of ["Pizza Teste da Casa", "R$ 39,90", "Avenida Paulista"]) {
  if (!html.includes(t) && !(await cp.getByText(t).count())) {
    await cp.click("text=Informações da loja");
  }
}
const hasProduct = await cp.getByText("Pizza Teste da Casa").count();
const logoOk = await cp.locator("header img[src^='/api/images/']").count();
const brandColor = await cp.evaluate(() => getComputedStyle(document.querySelector("[style*='--brand']")).getPropertyValue("--brand"));
log("cardápio público: produto novo =", hasProduct > 0, "| logo/banner enviados =", logoOk, "| cor =", brandColor.trim());
await cp.click("text=Informações da loja");
const infoTxt = await cp.locator("[role=dialog]").innerText();
log("info mostra endereço novo =", infoTxt.includes("Avenida Paulista, " + NUM), "| whatsapp novo =", infoTxt.includes("91234-5678"));
await cp.keyboard.press("Escape");
await cp.screenshot({ path: SP + "/e-public.png" });

// ---------- 4) pedido de teste ----------
await cp.getByRole("button", { name: /Pizza Teste da Casa/ }).first().click();
await cp.getByRole("dialog").getByText("Grande").click();
await cp.fill("#obs", "sem cebola");
await cp.getByRole("button", { name: /^Adicionar/ }).click();
await cp.getByRole("button", { name: /Ver carrinho/ }).click();
await cp.getByRole("button", { name: /Continuar/ }).click();
await cp.fill('input[placeholder="Seu nome"]', "Cliente E2E");
await cp.fill('input[placeholder^="WhatsApp"]', "(11) 95555-4444");
await cp.getByRole("button", { name: /Retirar no local/ }).click();
await cp.getByRole("button", { name: /Dinheiro/ }).click();
await cp.fill('input[placeholder^="Troco"]', "100");
await cp.getByRole("button", { name: /Enviar pedido/ }).click();
await cp.waitForSelector("text=/Pedido #\\d+ registrado/");
const orderTitle = await cp.locator("text=/Pedido #\\d+ registrado/").innerText();
const wa = decodeURIComponent(await cp.locator('a[href^="https://wa.me"]').getAttribute("href"));
log(orderTitle, "| WhatsApp para", wa.slice(0, 28), "| contém 'sem cebola' =", wa.includes("sem cebola"), "| total 49,90 =", wa.replace(/\u00a0/g," ").includes("R$ 49,90"));
await cp.screenshot({ path: SP + "/e-done.png" });
const trackHref = await cp.locator("a:has-text('Acompanhar')").getAttribute("href");

// ---------- 5) pedido aparece no painel correto, com alerta ----------
await op.goto(BASE + "/admin");
await op.waitForSelector("text=Cliente E2E"); await op.waitForLoadState("networkidle");
await op.screenshot({ path: SP + "/e-orders2.png" });
log("pedido apareceu no painel da pizzaria");
const card = op.locator("article", { hasText: "Cliente E2E" }).first();
await card.getByRole("button", { name: "Confirmar recebimento" }).click();
await op.waitForSelector("text=/: Recebido/");
log("status atualizado para Recebido");
await cp.goto(BASE + trackHref);
await cp.waitForSelector("text=Recebido");
log("cliente vê status 'Recebido' na página de acompanhamento");

// ---------- 6) isolamento: o outro estabelecimento ----------
const otherCtx = await b.newContext({ viewport: { width: 1280, height: 860 } });
const xp = await otherCtx.newPage(); watch(xp, "outra-loja");
await xp.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
await xp.fill("#email", "ze@lanchonete.teste");
await xp.fill("#password", "lanche1234");
await xp.click("button:has-text('Entrar')");
await xp.waitForURL(BASE + "/admin");
const seesOther = await xp.getByText("Cliente E2E").count();
log("lanchonete vê pedido da pizzaria? ", seesOther > 0);
const api = xp.request;
const demoOrders = await (await ownerCtx.request.get(BASE + "/api/admin/orders?filter=all")).json();
const oid = demoOrders.orders[0].id;
const pid = (await (await ownerCtx.request.get(BASE + "/api/admin/products")).json()).products[0].id;
const H = { headers: { origin: BASE } };
const r1 = await api.get(`${BASE}/api/admin/orders/${oid}`);
const r2 = await api.patch(`${BASE}/api/admin/orders/${oid}`, { data: { status: "cancelled" }, ...H });
const r3 = await api.put(`${BASE}/api/admin/products/${pid}`, { data: { category_id: 1, name: "hack", price_cents: 1, image_url: null, option_groups: [] }, ...H });
const r4 = await api.delete(`${BASE}/api/admin/products/${pid}`, H);
const r5 = await api.post(`${BASE}/api/admin/products/reorder`, { data: { ids: [pid] }, ...H });
const listX = (await (await api.get(`${BASE}/api/admin/orders?filter=all`)).json()).orders.length;
const r6 = await api.patch(`${BASE}/api/admin/store`, { data: { logo_url: demoOrders.orders[0] ? (await (await ownerCtx.request.get(BASE + "/api/admin/store")).json()).store.logo_url : null }, ...H });
const r7 = await api.get(`${BASE}/api/super/stores`);
log("outra loja -> GET pedido alheio:", r1.status(), "| PATCH status:", r2.status(), "| PUT produto:", r3.status(), "| DELETE produto:", r4.status(), "| reordenar:", r5.status(), "| usar imagem alheia:", r6.status(), "| API super:", r7.status(), "| pedidos próprios:", listX);
const anon = await b.newContext();
const a1 = await anon.request.get(`${BASE}/api/admin/orders`);
const a2 = await anon.request.patch(`${BASE}/api/admin/store`, { data: { name: "x" }, ...H });
log("sem login -> GET pedidos:", a1.status(), "| PATCH loja:", a2.status());
const csrf = await ownerCtx.request.patch(`${BASE}/api/admin/store`, { data: { name: "x" }, headers: { origin: "https://site-malicioso.com" } });
log("requisição de outro site com cookie válido (CSRF):", csrf.status());
const stillOk = (await (await ownerCtx.request.get(BASE + "/api/admin/orders?filter=all")).json()).orders.find((o) => o.id === oid).status;
log("status do pedido da pizzaria continua:", stillOk);
await xp.screenshot({ path: SP + "/e-other.png" });

console.log("\nERROS DE NAVEGADOR:", errors.length ? errors : "nenhum");
console.log("Capturas de tela em", SP);
await b.close();
const failed =
  seesOther > 0 ||
  [r1, r2, r3, r4].some((r) => r.status() !== 404) ||
  r5.status() !== 403 ||
  r7.status() !== 403 ||
  a1.status() !== 401 ||
  csrf.status() !== 403 ||
  errors.length > 0;
if (failed) {
  console.error("\n✖ FALHOU");
  process.exit(1);
}
console.log("\n✔ Fluxo completo aprovado");
