"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Store } from "@/lib/types";
import { api } from "../api";
import { useToast } from "../ui";

/** Estado de um formulário de configurações da loja (salva só os campos informados). */
export function useStoreForm<K extends keyof Store>(store: Store, fields: readonly K[]) {
  const pick = (s: Store) => Object.fromEntries(fields.map((f) => [f, s[f]])) as Pick<Store, K>;
  const [base, setBase] = useState(() => pick(store));
  const [values, setValues] = useState(base);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(base), [values, base]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <F extends K>(k: F, v: Store[F]) => setValues((s) => ({ ...s, [k]: v }));

  async function save(override?: Partial<Pick<Store, K>>) {
    setSaving(true);
    try {
      const { store: saved } = await api<{ store: Store }>("/api/admin/store", "PATCH", { ...values, ...override });
      const next = pick(saved);
      setBase(next);
      setValues(next);
      toast("ok", "Alterações salvas! Já estão no seu cardápio.");
      router.refresh();
      return true;
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Erro ao salvar.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { values, set, dirty, saving, save: (o?: Partial<Pick<Store, K>>) => save(o), reset: () => setValues(base) };
}
