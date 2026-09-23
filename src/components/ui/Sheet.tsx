"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/** Modal que vira "bottom sheet" no celular. */
export function Sheet({
  open,
  onClose,
  children,
  title,
  wide = false,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  wide?: boolean;
  footer?: React.ReactNode;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative flex max-h-[94dvh] w-full animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-white text-stone-900 shadow-2xl sm:rounded-3xl ${
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        }`}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <div className="min-w-0 text-lg font-bold">{title}</div>
            <button onClick={onClose} className="rounded-full p-2 text-stone-500 hover:bg-stone-100" aria-label="Fechar">
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-stone-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}
