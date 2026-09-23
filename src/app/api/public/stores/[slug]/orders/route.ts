import { clientIp, HttpError, json, rateLimit, readJson, route } from "@/lib/http";
import { createOrder } from "@/lib/repo/orders";
import { getStoreBySlug } from "@/lib/repo/stores";
import { orderSchema } from "@/lib/validation";

export const POST = route(async (req, ctx: RouteContext<"/api/public/stores/[slug]/orders">) => {
  const store = getStoreBySlug((await ctx.params).slug);
  if (!store || !store.is_active) throw new HttpError(404, "Estabelecimento não encontrado.");
  rateLimit(`order:${clientIp(req)}`, 12, 10 * 60_000);
  const input = orderSchema.parse(await readJson(req));
  const order = createOrder(store, input);
  return json(
    {
      order: {
        number: order.number,
        token: order.public_token,
        status: order.status,
        total_cents: order.total_cents,
      },
      full: order,
    },
    { status: 201 },
  );
});
