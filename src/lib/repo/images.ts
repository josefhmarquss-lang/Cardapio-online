import crypto from "node:crypto";
import { db } from "../db";
import { HttpError } from "../errors";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Detecta o tipo real pelo conteúdo (não confia na extensão nem no Content-Type enviado). */
function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 6).toString("ascii") === "GIF87a" || buf.subarray(0, 6).toString("ascii") === "GIF89a") return "image/gif";
  return null;
}

export function saveImage(storeId: number, buf: Buffer): string {
  if (buf.length > MAX_IMAGE_BYTES) throw new HttpError(413, "Imagem muito grande (máx. 4 MB).");
  const mime = sniff(buf);
  if (!mime) throw new HttpError(415, "Formato não suportado. Envie JPG, PNG, WEBP ou GIF.");
  const id = crypto.randomBytes(16).toString("hex");
  db().prepare("INSERT INTO images (id, store_id, mime, data, size) VALUES (?, ?, ?, ?, ?)").run(id, storeId, mime, buf, buf.length);
  return `/api/images/${id}`;
}

export function getImage(id: string): { mime: string; data: Buffer } | null {
  if (!/^[a-f0-9]{32}$/.test(id)) return null;
  return (db().prepare("SELECT mime, data FROM images WHERE id = ?").get(id) as { mime: string; data: Buffer }) ?? null;
}

/** Remove imagens da loja que não são mais usadas (enviadas há mais de 1 hora). */
export function pruneImages(storeId: number) {
  const d = db();
  const s = d.prepare("SELECT logo_url, banner_url, pix_qr_url FROM stores WHERE id = ?").get(storeId) as Record<string, string | null>;
  const used = new Set<string>(
    [s?.logo_url, s?.banner_url, s?.pix_qr_url, ...(d.prepare("SELECT image_url FROM products WHERE store_id = ?").all(storeId) as { image_url: string | null }[]).map((r) => r.image_url)]
      .filter((u): u is string => !!u && u.startsWith("/api/images/"))
      .map((u) => u.slice("/api/images/".length)),
  );
  const cutoff = new Date(Date.now() - 3600_000).toISOString();
  const candidates = d.prepare("SELECT id FROM images WHERE store_id = ? AND created_at < ?").all(storeId, cutoff) as { id: string }[];
  const del = d.prepare("DELETE FROM images WHERE id = ? AND store_id = ?");
  for (const c of candidates) if (!used.has(c.id)) del.run(c.id, storeId);
}
