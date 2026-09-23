"use client";

import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { uploadImage } from "./api";

// ---------- avisos (toasts) ----------
type Toast = { id: number; kind: "ok" | "error" | "info"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, kind, text }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), kind === "error" ? 6000 : 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:items-end">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-md animate-slide-up items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${
              t.kind === "error" ? "bg-red-600 text-white" : t.kind === "ok" ? "bg-stone-900 text-white" : "bg-orange-600 text-white"
            }`}
          >
            {t.kind === "error" ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- chave liga/desliga ----------
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}) {
  const sw = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? "bg-emerald-500" : "bg-stone-300"}`}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
  if (!label) return sw;
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-1">
      <span>
        <span className="block text-sm font-semibold text-stone-800">{label}</span>
        {description && <span className="block text-xs text-stone-500">{description}</span>}
      </span>
      {sw}
    </label>
  );
}

// ---------- seção de formulário ----------
export function Section({ title, description, children, actions }: { title: string; description?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

// ---------- barra "salvar alterações" ----------
export function SaveBar({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void }) {
  if (!dirty && !saving) return null;
  return (
    <div className="sticky bottom-3 z-30 mt-6 flex animate-slide-up items-center justify-between gap-3 rounded-2xl bg-stone-900 p-3 pl-5 text-white shadow-2xl">
      <span className="text-sm font-medium">Você tem alterações não salvas</span>
      <div className="flex gap-2">
        <button type="button" onClick={onReset} disabled={saving} className="btn text-stone-300 hover:bg-white/10">
          Descartar
        </button>
        <button type="button" onClick={onSave} disabled={saving} className="btn-primary">
          {saving && <Loader2 className="size-4 animate-spin" />} Salvar alterações
        </button>
      </div>
    </div>
  );
}

// ---------- envio de imagem ----------
export function ImageInput({
  value,
  onChange,
  aspect = "square",
  maxSide,
  label = "Enviar imagem",
  hint,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  aspect?: "square" | "wide" | "round";
  maxSide?: number;
  label?: string;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const box = aspect === "wide" ? "aspect-[8/3] w-full" : aspect === "round" ? "size-28 rounded-full" : "size-36";

  async function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadImage(f, maxSide));
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className={`flex gap-4 ${aspect === "wide" ? "flex-col" : "flex-col items-start sm:flex-row sm:items-center"}`}>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files);
        }}
        className={`${box} relative grid shrink-0 place-items-center overflow-hidden border-2 border-dashed border-stone-300 bg-stone-50 text-stone-400 transition hover:border-orange-400 hover:bg-orange-50 ${
          aspect === "round" ? "" : "rounded-2xl"
        }`}
      >
        {value ? (
           
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs font-medium">
            <ImagePlus className="size-7" /> Adicionar
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="size-6 animate-spin text-orange-600" />
          </span>
        )}
      </button>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline" onClick={() => ref.current?.click()} disabled={busy}>
            <Upload className="size-4" /> {value ? "Trocar imagem" : label}
          </button>
          {value && (
            <button type="button" className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => onChange(null)} disabled={busy}>
              <Trash2 className="size-4" /> Remover
            </button>
          )}
        </div>
        <p className="text-xs text-stone-500">{hint ?? "JPG, PNG ou WEBP até 4 MB. A imagem é otimizada automaticamente."}</p>
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

export function MoneyInput({ value, onChange, placeholder = "0,00", className = "" }: { value: number; onChange: (cents: number) => void; placeholder?: string; className?: string }) {
  // entrada em estilo "caixa registradora": digitar 1290 => R$ 12,90
  const text = (value / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">R$</span>
      <input
        className="field pl-10 tabular-nums"
        inputMode="numeric"
        placeholder={placeholder}
        value={value ? text : ""}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
          onChange(Number(digits || 0));
        }}
      />
    </div>
  );
}

export function Empty({ icon: Icon, title, text, children }: { icon: React.ElementType; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-orange-50 text-orange-600">
        <Icon className="size-7" />
      </div>
      <h3 className="mt-4 font-bold text-stone-900">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-stone-500">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function confirmAction(message: string) {
  return window.confirm(message);
}
