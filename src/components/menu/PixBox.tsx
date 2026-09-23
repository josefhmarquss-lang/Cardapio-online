"use client";

import { Check, Copy, Info } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";
import { buildPixPayload, PIX_KEY_TYPES } from "@/lib/pix";

type PixStore = {
  pix_key: string;
  pix_key_type: string;
  pix_receiver_name: string;
  pix_qr_url: string | null;
  payment_instructions: string;
  address_city: string;
};

export function PixBox({ store, amountCents, txid }: { store: PixStore; amountCents?: number; txid?: string }) {
  const payload = store.pix_key
    ? buildPixPayload({
        key: store.pix_key,
        keyType: store.pix_key_type,
        name: store.pix_receiver_name,
        city: store.address_city,
        amountCents,
        txid,
      })
    : null;
  const [generatedQr, setGeneratedQr] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "key" | null>(null);

  useEffect(() => {
    if (store.pix_qr_url || !payload) return;
    QRCode.toDataURL(payload, { margin: 1, width: 360, errorCorrectionLevel: "M" }).then(setGeneratedQr, () => setGeneratedQr(null));
  }, [payload, store.pix_qr_url]);

  const qr = store.pix_qr_url || generatedQr;
  const keyType = PIX_KEY_TYPES.find((t) => t.value === store.pix_key_type)?.label;

  async function copy(text: string, what: "code" | "key") {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
      <div className="flex items-center gap-2 font-bold text-emerald-900">
        <PixLogo /> Pagamento via Pix {amountCents ? <span className="ml-auto tabular-nums">{money(amountCents)}</span> : null}
      </div>
      <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {qr && (
           
          <img src={qr} alt="QR Code Pix" className="size-44 shrink-0 rounded-xl border border-emerald-200 bg-white p-2" />
        )}
        <div className="w-full min-w-0 space-y-2 text-sm">
          {store.pix_key && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">Chave Pix {keyType ? `(${keyType})` : ""}</div>
              <button onClick={() => copy(store.pix_key, "key")} className="mt-0.5 flex w-full items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-left font-mono text-[13px] ring-1 ring-emerald-200">
                <span className="truncate">{store.pix_key}</span>
                {copied === "key" ? <Check className="size-4 shrink-0 text-emerald-600" /> : <Copy className="size-4 shrink-0 text-stone-400" />}
              </button>
            </div>
          )}
          {store.pix_receiver_name && (
            <p>
              <span className="text-stone-500">Recebedor:</span> <strong>{store.pix_receiver_name}</strong>
            </p>
          )}
          {payload && !store.pix_qr_url && (
            <button onClick={() => copy(payload, "code")} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 font-semibold text-white hover:bg-emerald-700">
              {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied === "code" ? "Código copiado!" : "Copiar Pix copia e cola"}
            </button>
          )}
        </div>
      </div>
      {store.payment_instructions && <p className="mt-3 whitespace-pre-line text-sm text-stone-700">{store.payment_instructions}</p>}
      <p className="mt-3 flex gap-2 rounded-lg bg-white/70 p-2.5 text-xs text-stone-600">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        O pagamento é feito diretamente para o estabelecimento, pelo app do seu banco. Este cardápio não processa pagamentos: a
        confirmação é feita pela própria loja.
      </p>
    </div>
  );
}

export function PixLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#32BCAD"
        d="M17.2 16.9a2.9 2.9 0 0 1-2.1-.9l-3-3a.6.6 0 0 0-.8 0l-3 3a2.9 2.9 0 0 1-2.1.9h-.6l3.8 3.8a3 3 0 0 0 4.3 0l3.8-3.8h-.3ZM6.2 7.1c.8 0 1.6.3 2.1.9l3 3a.6.6 0 0 0 .8 0l3-3a2.9 2.9 0 0 1 2.1-.9h.3l-3.8-3.8a3 3 0 0 0-4.3 0L5.6 7.1h.6Zm14.5 2.8-2.3-2.3h-1.2c-.5 0-1 .2-1.4.6l-3 3a1.4 1.4 0 0 1-2 0l-3-3a2 2 0 0 0-1.4-.6H5l-2.3 2.3a3 3 0 0 0 0 4.3L5 16.4h1.4c.5 0 1-.2 1.4-.6l3-3a1.5 1.5 0 0 1 2 0l3 3c.4.4.9.6 1.4.6h1.2l2.3-2.3a3 3 0 0 0 0-4.3Z"
      />
    </svg>
  );
}
