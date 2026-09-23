"use client";

import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { api } from "../api";
import { PageHeader, Section, useToast } from "../ui";

export function AccountForm({ email, name }: { email: string; name: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return toast("error", "A nova senha deve ter pelo menos 8 caracteres.");
    if (next !== confirm) return toast("error", "A confirmação não confere com a nova senha.");
    setBusy(true);
    try {
      await api("/api/auth/password", "POST", { current, next });
      toast("ok", "Senha alterada. Outras sessões foram desconectadas.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Erro.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Minha conta" />
      <div className="space-y-6">
        <Section title="Acesso">
          <p className="text-sm">
            {name && <strong className="block">{name}</strong>}
            <span className="text-stone-600">{email}</span>
          </p>
        </Section>
        <Section title="Alterar senha" description="Use pelo menos 8 caracteres. Evite senhas óbvias.">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Senha atual</label>
              <input type="password" className="field" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Nova senha</label>
                <input type="password" className="field" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
              </div>
              <div>
                <label className="label">Confirmar nova senha</label>
                <input type="password" className="field" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
            </div>
            <button className="btn-primary" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Alterar senha
            </button>
          </form>
        </Section>
        <button
          className="btn-outline"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/admin/login";
          }}
        >
          <LogOut className="size-4" /> Sair do painel
        </button>
      </div>
    </div>
  );
}
