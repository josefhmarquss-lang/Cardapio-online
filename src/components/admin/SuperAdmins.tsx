"use client";

import { KeyRound, Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { api } from "./api";
import { Section, useToast } from "./ui";

type Admin = { id: number; email: string; name: string; created_at: string };

export function SuperAdmins({ initial, myId }: { initial: Admin[]; myId: number }) {
  const [admins, setAdmins] = useState(initial);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ admins: Admin[] }>("/api/super/admins", "POST", form);
      setAdmins(r.admins);
      setForm({ name: "", email: "", password: "" });
      toast("ok", "Administrador adicionado. Envie o e-mail e a senha para a pessoa.");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Erro.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: Admin) {
    if (!window.confirm(`Remover o acesso de ${a.email} ao painel da plataforma?`)) return;
    try {
      const r = await api<{ admins: Admin[] }>(`/api/super/admins/${a.id}`, "DELETE");
      setAdmins(r.admins);
      toast("ok", "Acesso removido.");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Erro.");
    }
  }

  return (
    <Section title="Administradores da plataforma" description="Pessoas com acesso a este painel (/super).">
      <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
        {admins.map((a) => (
          <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
            <ShieldCheck className="size-4 shrink-0 text-orange-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{a.name || a.email}</p>
              {a.name && <p className="truncate text-xs text-stone-500">{a.email}</p>}
            </div>
            {a.id === myId ? (
              <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-500">você</span>
            ) : (
              <button className="btn-ghost px-2 text-red-600 hover:bg-red-50" onClick={() => remove(a)} aria-label="Remover">
                <Trash2 className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="space-y-3">
        <p className="text-sm font-semibold text-stone-700">Adicionar administrador</p>
        <input className="field" placeholder="Nome" maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="field" type="email" required placeholder="E-mail" maxLength={160} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input
          className="field"
          type="text"
          required
          minLength={8}
          maxLength={128}
          placeholder="Senha (mín. 8 caracteres)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn-dark w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Adicionar administrador
        </button>
        <p className="text-xs text-stone-500">Administradores podem cadastrar, desativar lojas e redefinir senhas. Dê acesso só a quem você confia.</p>
      </form>
    </Section>
  );
}

export function MyPassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/auth/password", "POST", { current, next });
      setCurrent("");
      setNext("");
      toast("ok", "Senha alterada.");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Erro.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Minha senha" description="A conta definida nas variáveis do servidor volta para a senha de SUPERADMIN_PASSWORD a cada atualização.">
      <form onSubmit={submit} className="space-y-3">
        <input className="field" type="password" required placeholder="Senha atual" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <input className="field" type="password" required minLength={8} placeholder="Nova senha (mín. 8)" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        <button className="btn-outline w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />} Alterar minha senha
        </button>
      </form>
    </Section>
  );
}
