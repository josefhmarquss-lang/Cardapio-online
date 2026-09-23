"use client";

import { Info } from "lucide-react";
import { PixBox } from "@/components/menu/PixBox";
import { PIX_KEY_TYPES } from "@/lib/pix";
import type { Store } from "@/lib/types";
import { ImageInput, PageHeader, SaveBar, Section, Toggle } from "../ui";
import { useStoreForm } from "./useStoreForm";

const FIELDS = ["pay_pix", "pay_cash", "pay_card", "pix_key", "pix_key_type", "pix_receiver_name", "pix_qr_url", "payment_instructions"] as const;

export function PaymentForm({ store }: { store: Store }) {
  const f = useStoreForm(store, FIELDS);
  const v = f.values;

  return (
    <div>
      <PageHeader title="Pagamento e Pix" description="Formas de pagamento aceitas e dados do seu Pix." />
      <div className="mb-6 flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <Info className="mt-0.5 size-5 shrink-0" />
        <p>
          O cardápio <strong>não processa pagamentos</strong> e não tem integração bancária. O cliente paga direto para você (Pix, dinheiro ou
          cartão na entrega) e <strong>você confere e confirma o recebimento</strong> no seu banco antes de preparar o pedido.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Section title="Formas de pagamento aceitas">
            <Toggle checked={v.pay_pix} onChange={(x) => f.set("pay_pix", x)} label="Pix" />
            <Toggle checked={v.pay_cash} onChange={(x) => f.set("pay_cash", x)} label="Dinheiro" description="O cliente pode informar troco." />
            <Toggle checked={v.pay_card} onChange={(x) => f.set("pay_card", x)} label="Cartão na entrega/retirada" description="Crédito ou débito na maquininha." />
            {!v.pay_pix && !v.pay_cash && !v.pay_card && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Ative ao menos uma forma de pagamento.</p>}
          </Section>

          {v.pay_pix && (
            <Section title="Dados do Pix" description="Exibidos ao cliente depois que ele envia o pedido.">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Tipo de chave</label>
                  <select className="field" value={v.pix_key_type} onChange={(e) => f.set("pix_key_type", e.target.value)}>
                    <option value="">Selecione</option>
                    {PIX_KEY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Chave Pix</label>
                  <input className="field" maxLength={120} value={v.pix_key} onChange={(e) => f.set("pix_key", e.target.value)} placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória" />
                </div>
                <div className="sm:col-span-3">
                  <label className="label">Nome do recebedor</label>
                  <input className="field" maxLength={80} value={v.pix_receiver_name} onChange={(e) => f.set("pix_receiver_name", e.target.value)} placeholder="Como aparece no banco" />
                  <p className="hint">Use o mesmo nome cadastrado no banco para o cliente conferir antes de pagar.</p>
                </div>
              </div>
              <div>
                <span className="label">Imagem do QR Code (opcional — só é usada se não houver chave)</span>
                <ImageInput
                  value={v.pix_qr_url}
                  onChange={(u) => f.set("pix_qr_url", u)}
                  maxSide={800}
                  label="Enviar QR Code"
                  hint="Com a chave Pix preenchida, o cliente recebe um QR Code gerado automaticamente com o valor exato de cada pedido — recomendado. A imagem só aparece para lojas sem chave cadastrada, e nesse caso o cliente digita o valor."
                />
              </div>
              <div>
                <label className="label">Instruções de pagamento</label>
                <textarea
                  className="field resize-none"
                  rows={3}
                  maxLength={600}
                  value={v.payment_instructions}
                  onChange={(e) => f.set("payment_instructions", e.target.value)}
                  placeholder="Ex.: Após pagar, envie o comprovante pelo WhatsApp."
                />
              </div>
            </Section>
          )}
        </div>
        {v.pay_pix && (
          <div className="xl:sticky xl:top-6 xl:self-start">
            <p className="mb-2 text-sm font-semibold text-stone-500">Como o cliente vê (pedido de exemplo de R$ 59,90)</p>
            {v.pix_key || v.pix_qr_url ? (
              <PixBox store={{ ...v, address_city: store.address_city }} amountCents={5990} txid="PREVIEW" />
            ) : (
              <div className="card p-6 text-center text-sm text-stone-500">Informe a chave Pix para ver a prévia.</div>
            )}
          </div>
        )}
      </div>
      <SaveBar dirty={f.dirty} saving={f.saving} onSave={() => f.save()} onReset={f.reset} />
    </div>
  );
}
