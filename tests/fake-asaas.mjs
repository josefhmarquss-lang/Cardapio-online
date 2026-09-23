/**
 * Simulador mínimo da API v3 do Asaas, para testes automatizados sem internet.
 * Rotas de controle (só do teste): POST /__pay/:paymentId e POST /__set/:paymentId.
 */
import http from "node:http";

export function startFakeAsaas({ port = 3999, apiKey = "fake-key", webhookUrl, webhookToken } = {}) {
  const state = { customers: [], subscriptions: [], payments: [], requests: [] };
  let seq = 1;
  const id = (p) => `${p}_${String(seq++).padStart(6, "0")}`;
  const addMonth = (ymd) => {
    const [y, m, d] = ymd.split("-").map(Number);
    const t = new Date(Date.UTC(y, m, 1, 12));
    const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0, 12)).getUTCDate();
    t.setUTCDate(Math.min(d, last));
    return t.toISOString().slice(0, 10);
  };
  const newPayment = (sub, dueDate) => {
    const p = {
      id: id("pay"),
      subscription: sub.id,
      customer: sub.customer,
      value: sub.value,
      status: "PENDING",
      dueDate,
      paymentDate: null,
      clientPaymentDate: null,
      invoiceUrl: `http://localhost:${port}/i/${seq}`,
      billingType: sub.billingType,
      deleted: false,
    };
    state.payments.push(p);
    return p;
  };
  const send = (res, code, body) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  const err = (res, code, description) => send(res, code, { errors: [{ code: "invalid", description }] });

  async function notify(event, payment) {
    if (!webhookUrl) return;
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "asaas-access-token": webhookToken || "" },
      body: JSON.stringify({ id: `evt_${seq++}`, event, payment }),
    }).catch(() => {});
  }

  const server = http.createServer(async (req, res) => {
    let raw = "";
    for await (const c of req) raw += c;
    const body = raw ? JSON.parse(raw) : {};
    const url = new URL(req.url, "http://x");
    const path = url.pathname;
    state.requests.push({ method: req.method, path, body, ua: req.headers["user-agent"] });

    // ---- controle do teste ----
    let m;
    if (req.method === "POST" && (m = path.match(/^\/__pay\/(.+)$/))) {
      const p = state.payments.find((x) => x.id === m[1]);
      if (!p) return err(res, 404, "not found");
      p.status = "RECEIVED";
      p.paymentDate = p.clientPaymentDate = new Date().toISOString().slice(0, 10);
      const sub = state.subscriptions.find((s) => s.id === p.subscription);
      if (sub && !sub.deleted) newPayment(sub, addMonth(p.dueDate));
      await notify("PAYMENT_RECEIVED", p);
      return send(res, 200, p);
    }
    if (req.method === "POST" && (m = path.match(/^\/__set\/(.+)$/))) {
      const p = state.payments.find((x) => x.id === m[1]);
      if (!p) return err(res, 404, "not found");
      Object.assign(p, body);
      return send(res, 200, p);
    }

    // ---- API ----
    if (req.headers["access_token"] !== apiKey) return send(res, 401, { errors: [{ code: "invalid_access_token", description: "A chave de API fornecida é inválida" }] });
    if (!req.headers["user-agent"]) return err(res, 400, "User-Agent obrigatório");

    if (req.method === "POST" && path === "/v3/customers") {
      if (!body.cpfCnpj) return err(res, 400, "O CPF/CNPJ do cliente é obrigatório.");
      const c = { id: id("cus"), ...body };
      state.customers.push(c);
      return send(res, 200, c);
    }
    if (req.method === "POST" && path === "/v3/subscriptions") {
      if (!state.customers.find((c) => c.id === body.customer)) return err(res, 400, "Cliente inexistente.");
      const s = { id: id("sub"), status: "ACTIVE", deleted: false, ...body };
      state.subscriptions.push(s);
      newPayment(s, body.nextDueDate);
      return send(res, 200, s);
    }
    if ((m = path.match(/^\/v3\/subscriptions\/([^/]+)$/))) {
      const s = state.subscriptions.find((x) => x.id === m[1] && !x.deleted);
      if (!s) return err(res, 404, "Assinatura não encontrada.");
      if (req.method === "PUT") {
        Object.assign(s, { value: body.value ?? s.value, description: body.description ?? s.description });
        if (body.updatePendingPayments) state.payments.filter((p) => p.subscription === s.id && p.status === "PENDING").forEach((p) => (p.value = s.value));
        return send(res, 200, s);
      }
      if (req.method === "DELETE") {
        s.deleted = true;
        s.status = "INACTIVE";
        state.payments.filter((p) => p.subscription === s.id && p.status === "PENDING").forEach((p) => (p.deleted = true));
        return send(res, 200, { deleted: true, id: s.id });
      }
    }
    if (req.method === "GET" && (m = path.match(/^\/v3\/subscriptions\/([^/]+)\/payments$/))) {
      return send(res, 200, { object: "list", data: state.payments.filter((p) => p.subscription === m[1] && !p.deleted) });
    }
    if (req.method === "GET" && (m = path.match(/^\/v3\/payments\/([^/]+)$/))) {
      const p = state.payments.find((x) => x.id === m[1]);
      return p ? send(res, 200, p) : err(res, 404, "not found");
    }
    return err(res, 404, `rota não simulada: ${req.method} ${path}`);
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ state, close: () => server.close() })));
}
