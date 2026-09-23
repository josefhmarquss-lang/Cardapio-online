import type { NextRequest } from "next/server";
import { json } from "@/lib/http";
import { getOrderByToken } from "@/lib/repo/orders";

/** Status do pedido para o consumidor (acesso pelo token secreto do pedido). */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/public/orders/[token]">) {
  const order = getOrderByToken((await ctx.params).token);
  if (!order) return json({ error: "Pedido não encontrado." }, { status: 404 });
  return json({ status: order.status, updated_at: order.updated_at });
}
