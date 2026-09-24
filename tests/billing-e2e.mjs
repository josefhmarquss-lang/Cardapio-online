/**
 * Teste do cadastro automático + assinatura (com o simulador do Asaas).
 * Suba o app apontando para o simulador:
 *   ASAAS_ENV=production ASAAS_API_URL=http://localhost:3999/v3 ASAAS_API_KEY=fake-key ASAAS_WEBHOOK_TOKEN=wh-token \
 *   DATABASE_PATH=/tmp/x.db SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... npm start
 * e rode: BASE_URL=http://localhost:3000 DATABASE_PATH=/tmp/x.db npm run test:billing
 */
import Database from "better-sqlite3";
import { chromium } from "playwright";
import { startFakeAsaas } from "./fake-asaas.mjs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SUPER_EMAIL = process.env.SUPERADMIN_EMAIL || "super@cardapio.local";
const SUPER_PASS = process.env.SUPERADMIN_PASSWORD || "super12345";
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "✔" : "✖"} ${msg}`);
  if (!ok) fails.push(msg);
};

const fake = await startFakeAsaas({ port: 3999, apiKey: "fake-key", webhookUrl: `${BASE}/api/webhooks/asaas`, webhookToken: "wh-token" });
const db = new Database(process.env.DATABASE_PATH);
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
const H = { headers: { origin: BASE } };
const uniq = Date.now().toString(36);
const slug = `pizzaria-teste-${uniq}`;
const email = `dono-${uniq}@exemplo.com`;

try {
  // ---------- página de vendas ----------
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  check((await p.getByText("Testar 3 dias grátis").count()) > 0, "página de vendas mostra 'Testar 3 dias grátis'");

  // ---------- cadastro ----------
  await p.goto(BASE + "/assinar?plano=essencial", { waitUntil: "networkidle" });
  await p.fill("input[placeholder='Ex.: Pizzaria do Zé']", `Pizzaria Teste ${uniq}`);
  await p.locator("label:has-text('Endereço do cardápio') + div input").fill(slug);
  await p.fill("input[placeholder='(82) 99999-9999']", "(82) 99876-5432");
  await p.locator("label:has-text('Nome completo') + input").fill("João da Silva");
  await p.locator("label:has-text('CPF ou CNPJ') + input").fill("11111111111");
  await p.locator("label:has-text('E-mail') + input").fill(email);
  await p.locator("input[autocomplete='new-password']").fill("senha12345");
  await p.click("button:has-text('Criar meu cardápio')");
  check((await p.getByText("Confira o CPF ou CNPJ").count()) > 0, "CPF inválido é recusado");
  await p.locator("label:has-text('CPF ou CNPJ') + input").fill("52998224725");
  await p.click("button:has-text('Criar meu cardápio')");
  await p.waitForURL("**/admin?bemvindo=1", { timeout: 20000 });
  await p.waitForLoadState("networkidle");
  check(true, "cadastro concluído e entrou no painel");
  check((await p.getByText("Teste grátis:").count()) > 0, "aviso de teste grátis no painel");
  check((await p.getByText("Bem-vindo! Monte o seu cardápio").count()) > 0, "guia de primeiros passos aparece");
  await p.screenshot({ path: "/tmp/billing-1-painel.png" });

  const cust = fake.state.customers.at(-1);
  const sub = fake.state.subscriptions.at(-1);
  const due = new Date(Date.now() - 3 * 3600_000 + 3 * 86400_000).toISOString().slice(0, 10);
  check(cust?.cpfCnpj === "52998224725" && cust?.email === email, "cliente criado no Asaas com CPF e e-mail");
  check(sub?.value === 59.9 && sub?.nextDueDate === due && sub?.billingType === "UNDEFINED", `assinatura R$ 59,90 com 1º vencimento em ${due}`);
  check(fake.state.requests.every((r) => r.path.startsWith("/__") || r.ua), "todas as chamadas enviam User-Agent");

  // ---------- tela de assinatura ----------
  await p.goto(BASE + "/admin/assinatura", { waitUntil: "networkidle" });
  check((await p.getByText(/Teste grátis até/).count()) > 0, "assinatura mostra 'Teste grátis até'");
  const payHref = await p.locator("a:has-text('Pagar agora')").getAttribute("href");
  check(payHref?.startsWith("http://localhost:3999/i/"), "botão 'Pagar agora' leva à fatura do Asaas");
  await p.screenshot({ path: "/tmp/billing-2-assinatura.png", fullPage: true });

  // ---------- limite de produtos do Essencial ----------
  const req = ctx.request;
  const cat = await (await req.post(BASE + "/api/admin/categories", { data: { name: "Pizzas" }, ...H })).json();
  let created = 0;
  const LIMIT = 15;
  for (let i = 0; i < LIMIT; i++) {
    const r = await req.post(BASE + "/api/admin/products", { data: { category_id: cat.category.id, name: `Pizza ${i}`, price_cents: 1000, image_url: null }, ...H });
    if (r.ok()) created++;
  }
  const r61 = await req.post(BASE + "/api/admin/products", { data: { category_id: cat.category.id, name: "Pizza extra", price_cents: 1000, image_url: null }, ...H });
  check(created === LIMIT && r61.status() === 403, `Essencial: ${LIMIT} produtos aceitos, o ${LIMIT + 1}º recusado (${r61.status()})`);
  const downg = await req.post(BASE + "/api/admin/billing/plan", { data: { plan: "profissional" }, ...H });
  check(downg.ok() && fake.state.subscriptions.at(-1).value === 79.9, "troca para Profissional atualiza a assinatura para R$ 79,90");
  check(fake.state.payments.filter((x) => x.subscription === sub.id && x.status === "PENDING").every((x) => x.value === 79.9), "fatura em aberto também passou para R$ 79,90");
  const r61b = await req.post(BASE + "/api/admin/products", { data: { category_id: cat.category.id, name: "Pizza extra", price_cents: 1000, image_url: null }, ...H });
  check(r61b.ok(), `no Profissional o ${LIMIT + 1}º produto é aceito`);
  const back = await req.post(BASE + "/api/admin/billing/plan", { data: { plan: "essencial" }, ...H });
  check(back.status() === 409, `voltar ao Essencial com ${LIMIT + 1} produtos é bloqueado`);

  // ---------- vencido: cardápio e painel pausados ----------
  const storeId = db.prepare("SELECT id FROM stores WHERE slug = ?").get(slug).id;
  const openPay = fake.state.payments.find((x) => x.subscription === sub.id && x.status === "PENDING");
  const past = new Date(Date.now() - 20 * 86400_000).toISOString().slice(0, 10);
  await fetch(`http://localhost:3999/__set/${openPay.id}`, { method: "POST", body: JSON.stringify({ dueDate: past, status: "OVERDUE" }) });
  db.prepare("UPDATE store_billing SET trial_ends_at = ?, synced_at = '2000-01-01T00:00:00Z' WHERE store_id = ?").run(past, storeId);
  await p.goto(BASE + "/" + slug, { waitUntil: "networkidle" });
  check((await p.getByText("temporariamente indisponível").count()) > 0, "cardápio público pausado após vencer");
  const ord = await ctx.request.post(`${BASE}/api/public/stores/${slug}/orders`, { data: {}, ...H });
  check(ord.status() === 409, "pedido em loja pausada é recusado");
  const locked = await req.get(BASE + "/api/admin/products");
  check(locked.status() === 402, "APIs do painel respondem 402 com a assinatura vencida");
  await p.goto(BASE + "/admin/produtos", { waitUntil: "networkidle" });
  check((await p.getByText("Painel pausado").count()) > 0, "painel mostra tela de pausa");
  await p.screenshot({ path: "/tmp/billing-3-pausado.png" });
  await p.goto(BASE + "/admin/assinatura", { waitUntil: "networkidle" });
  check((await p.getByText("Cardápio pausado").count()) > 0, "tela de assinatura continua acessível");

  // ---------- webhook com token errado ----------
  const bad = await fetch(`${BASE}/api/webhooks/asaas`, { method: "POST", headers: { "asaas-access-token": "errado" }, body: "{}" });
  check(bad.status === 401, "aviso do Asaas com token errado é recusado");

  // ---------- pagamento confirmado pelo aviso do Asaas ----------
  await fetch(`http://localhost:3999/__pay/${openPay.id}`, { method: "POST" });
  const row = db.prepare("SELECT paid_until FROM store_billing WHERE store_id = ?").get(storeId);
  const expected = (() => {
    const [y, m, d] = past.split("-").map(Number);
    const t = new Date(Date.UTC(y, m, 1, 12));
    const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0, 12)).getUTCDate();
    t.setUTCDate(Math.min(d, last));
    return t.toISOString().slice(0, 10);
  })();
  check(row.paid_until === expected, `pagamento confirmado: acesso até ${row.paid_until} (vencimento + 1 mês)`);
  await p.goto(BASE + "/" + slug, { waitUntil: "networkidle" });
  check((await p.getByText("temporariamente indisponível").count()) === 0, "cardápio volta a funcionar após o pagamento");
  check((await req.get(BASE + "/api/admin/products")).ok(), "painel liberado após o pagamento");

  // ---------- cancelar e reativar ----------
  const c = await req.post(BASE + "/api/admin/billing/cancel", H);
  check(c.ok() && fake.state.subscriptions.find((s) => s.id === sub.id).deleted, "cancelar remove a assinatura no Asaas");
  check((await req.get(BASE + "/api/admin/products")).ok(), "após cancelar, o acesso continua até o fim do período pago");
  const re = await req.post(BASE + "/api/admin/billing/reactivate", H);
  const newSub = fake.state.subscriptions.at(-1);
  check(re.ok() && newSub.id !== sub.id && newSub.nextDueDate === expected, `reativar cria nova assinatura com vencimento em ${expected}`);

  // ---------- painel da plataforma ----------
  const sctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const sp = await sctx.newPage();
  await sp.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
  await sp.fill("#email", SUPER_EMAIL);
  await sp.fill("#password", SUPER_PASS);
  await sp.click("button:has-text('Entrar')");
  await sp.waitForURL("**/super");
  const li = sp.locator("li", { hasText: slug });
  check((await li.getByText(/Em dia até/).count()) > 0, "/super mostra a loja 'Em dia'");
  sp.on("dialog", (d) => d.accept());
  await li.getByText("passar para cobrança manual").click();
  await sp.waitForSelector("text=Loja em cobrança manual");
  check(fake.state.subscriptions.find((s) => s.id === newSub.id).deleted, "passar para manual cancela a assinatura no Asaas");
  check((await sp.locator("li", { hasText: slug }).getByText("Cobrança manual").count()) > 0, "loja aparece como 'Cobrança manual'");
  await sp.screenshot({ path: "/tmp/billing-4-super.png" });

  // ---------- lojas antigas não são afetadas ----------
  const demo = await (await fetch(`${BASE}/brasa-e-massa`)).text();
  check(!demo.includes("temporariamente indisponível"), "loja de demonstração (manual) segue funcionando");
} catch (e) {
  fails.push(String(e));
  console.error(e);
} finally {
  await b.close();
  fake.close();
}
check(errors.length === 0, `sem erros de JavaScript no navegador ${errors.length ? JSON.stringify(errors) : ""}`);
console.log(fails.length ? `\n✖ ${fails.length} falha(s)` : "\n✔ Assinatura aprovada");
process.exit(fails.length ? 1 : 0);
