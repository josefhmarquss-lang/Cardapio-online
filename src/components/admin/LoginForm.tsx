"use client";

import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível entrar.");
      window.location.href = data.redirect;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexão.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div>
        <label className="label" htmlFor="email">
          E-mail
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input id="email" type="email" required autoComplete="username" className="field pl-10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@sualoja.com" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="password">
          Senha
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            id="password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            className="field px-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" aria-label="Mostrar senha">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>}
      <button className="btn-primary w-full py-3 text-[15px]" disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" />} Entrar
      </button>
      <p className="text-center text-xs text-stone-400">Esqueceu a senha? Fale com o suporte para redefinir.</p>
    </form>
  );
}
