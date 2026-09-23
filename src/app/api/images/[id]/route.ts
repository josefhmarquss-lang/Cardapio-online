import type { NextRequest } from "next/server";
import { getImage } from "@/lib/repo/images";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/images/[id]">) {
  const img = getImage((await ctx.params).id);
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
