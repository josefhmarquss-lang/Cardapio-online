/**
 * Gera o "Pix Copia e Cola" (BR Code estático, padrão do Banco Central) a partir
 * da chave cadastrada pela loja. Não há integração bancária: o pagamento é feito
 * no app do banco do consumidor e a loja confere o recebimento manualmente.
 */

function field(id: string, value: string) {
  return id + String(value.length).padStart(2, "0") + value;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function ascii(s: string, max: number) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .\-]/g, "")
    .trim()
    .slice(0, max)
    .toUpperCase();
}

export function normalizePixKey(key: string, type: string): string {
  const k = key.trim();
  const digits = k.replace(/\D/g, "");
  if (type === "cpf" || type === "cnpj") return digits;
  if (type === "phone") return digits.startsWith("55") && digits.length > 11 ? `+${digits}` : `+55${digits}`;
  if (type === "email") return k.toLowerCase();
  return k;
}

export function buildPixPayload(opts: {
  key: string;
  keyType: string;
  name: string;
  city: string;
  amountCents?: number;
  txid?: string;
}): string | null {
  const key = normalizePixKey(opts.key, opts.keyType);
  const name = ascii(opts.name, 25);
  const city = ascii(opts.city || "BRASIL", 15);
  if (!key || !name) return null;
  const txid = (opts.txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  let p =
    field("00", "01") +
    field("26", field("00", "br.gov.bcb.pix") + field("01", key)) +
    field("52", "0000") +
    field("53", "986");
  if (opts.amountCents && opts.amountCents > 0) p += field("54", (opts.amountCents / 100).toFixed(2));
  p += field("58", "BR") + field("59", name) + field("60", city) + field("62", field("05", txid)) + "6304";
  return p + crc16(p);
}

export const PIX_KEY_TYPES: { value: string; label: string }[] = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Celular" },
  { value: "random", label: "Chave aleatória" },
];
