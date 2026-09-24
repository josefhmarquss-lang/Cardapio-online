import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, json, rateLimit, readJson, route } from "@/lib/http";

/**
 * "Meus pedidos": situação de vários pedidos de uma vez, a partir dos códigos
 * secretos guardados no aparelho do cliente. Só responde pedidos da loja informada.
 */
export const POST = route(async (req) => {
  rateLimit(`my-orders:${clientIp(req)}`, 120, 60_000);
  const { slug, tokens } = z
    .object({ slug: z.string().max(60), tokens: z.array(z.string().regex(/^[A-Za-z0-9_-]{10,64}$/)).max(20) })
    .parse(await readJson(req));
  if (!tokens.length) return json({ orders: [] });
  const rows = db()
    .prepare(
      `SELECT o.public_token AS token, o.number, o.status, o.fulfillment, o.total_cents, o.created_at, o.updated_at,
              (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS items
         FROM orders o JOIN stores s ON s.id = o.store_id
        WHERE s.slug = ? AND o.public_token IN (${tokens.map(() => "?").join(",")})
        ORDER BY o.id DESC`,
    )
    .all(slug, ...tokens);
  return json({ orders: rows });
});
