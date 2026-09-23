import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { HttpError } from "./errors";

export { HttpError };

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

/**
 * Bloqueia requisições de escrita vindas de outros sites (proteção CSRF,
 * somada ao cookie SameSite=Lax).
 */
export function assertSameOrigin(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") throw new HttpError(403, "Origem não permitida.");
  if (origin) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {}
    if (!host || originHost !== host) throw new HttpError(403, "Origem não permitida.");
  }
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/** Envolve um route handler com verificação de origem e tratamento de erros padronizado. */
export function route<C>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) {
        const first = e.issues[0];
        const where = first?.path?.length ? `${first.path.join(".")}: ` : "";
        return json({ error: `Dados inválidos — ${where}${first?.message ?? ""}` }, { status: 400 });
      }
      console.error(e);
      return json({ error: "Erro interno. Tente novamente." }, { status: 500 });
    }
  };
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "JSON inválido.");
  }
}

export function clientIp(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

const buckets = new Map<string, { count: number; reset: number }>();

/** Limitador simples em memória (por instância do servidor). */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return;
  }
  b.count++;
  if (b.count > limit) throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos e tente novamente.");
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
