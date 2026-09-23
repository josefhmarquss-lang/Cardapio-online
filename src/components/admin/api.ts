"use client";

/** Chamada às APIs do painel; lança Error com a mensagem do servidor. */
export async function api<T = unknown>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Sessão expirada.");
  }
  if (!res.ok) throw new Error(data.error || "Erro ao salvar.");
  return data as T;
}

/** Reduz a imagem no navegador antes do envio (carregamento mais rápido do cardápio). */
async function shrink(file: File, maxSide: number): Promise<Blob> {
  if (file.type === "image/gif") return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  const keepAlpha = file.type === "image/png";
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, keepAlpha ? "image/png" : "image/webp", 0.85));
  if (!blob) return file;
  return blob.size < file.size ? blob : file;
}

export async function uploadImage(file: File, maxSide = 1400): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem (JPG, PNG ou WEBP).");
  const blob = await shrink(file, maxSide);
  if (blob.size > 4 * 1024 * 1024) throw new Error("Imagem muito grande (máx. 4 MB).");
  const fd = new FormData();
  fd.append("file", blob, "imagem");
  const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Falha no envio da imagem.");
  return data.url as string;
}
