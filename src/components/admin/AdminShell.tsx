"use client";

import {
  Bell,
  BellOff,
  Bike,
  ClipboardList,
  ExternalLink,
  LayoutGrid,
  LogOut,
  Menu,
  Palette,
  Pizza,
  QrCode,
  Store,
  UserCog,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { api } from "./api";
import { ToastProvider } from "./ui";

const NAV = [
  { href: "/admin", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/produtos", label: "Produtos", icon: Pizza },
  { href: "/admin/categorias", label: "Categorias", icon: LayoutGrid },
  { href: "/admin/aparencia", label: "Aparência", icon: Palette },
  { href: "/admin/loja", label: "Loja e horários", icon: Store },
  { href: "/admin/entrega", label: "Entrega e retirada", icon: Bike },
  { href: "/admin/pagamento", label: "Pagamento e Pix", icon: QrCode },
  { href: "/admin/conta", label: "Minha conta", icon: UserCog },
];

type Pulse = { last_id: number; unseen: number; awaiting: number };
const PulseCtx = createContext<{ pulse: Pulse | null; version: number }>({ pulse: null, version: 0 });
/** `version` muda sempre que chega pedido novo: as telas usam para recarregar. */
export const useOrderPulse = () => useContext(PulseCtx);

// ---------- som de alerta (gerado via Web Audio, sem arquivos) ----------
let audioCtx: AudioContext | null = null;
function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx?.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function playChime() {
  const ctx = ensureAudio();
  if (!ctx) return;
  const notes = [880, 1175, 1568];
  for (let rep = 0; rep < 3; rep++) {
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + rep * 0.9 + i * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  }
}

export function AdminShell({
  children,
  user,
  store,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  store: { name: string; slug: string; logo_url: string | null; sound_enabled: boolean };
}) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [version, setVersion] = useState(0);
  const [alert, setAlert] = useState<number>(0);
  const [sound, setSound] = useState(store.sound_enabled);
  const [audioReady, setAudioReady] = useState(false);
  const lastId = useRef<number | null>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => setMenuOpen(false), [path]);

  // libera o áudio na primeira interação (exigência dos navegadores)
  useEffect(() => {
    const unlock = () => {
      ensureAudio();
      setAudioReady(true);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const check = useCallback(async () => {
    try {
      const p = await api<Pulse>("/api/admin/orders/pulse");
      setPulse(p);
      if (lastId.current !== null && p.last_id > lastId.current) {
        setAlert((n) => n + 1);
        setVersion((v) => v + 1);
        if (soundRef.current) playChime();
      }
      lastId.current = p.last_id;
    } catch {}
  }, []);

  useEffect(() => {
    check();
    const t = setInterval(check, 8000);
    const vis = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", vis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [check]);

  // título da aba pisca enquanto houver pedidos aguardando confirmação
  useEffect(() => {
    const base = `Painel — ${store.name}`;
    if (!pulse?.awaiting) {
      document.title = base;
      return;
    }
    let on = false;
    const t = setInterval(() => {
      on = !on;
      document.title = on ? `🔔 (${pulse.awaiting}) Novo pedido!` : base;
    }, 1200);
    return () => {
      clearInterval(t);
      document.title = base;
    };
  }, [pulse?.awaiting, store.name]);

  async function toggleSound() {
    const next = !sound;
    setSound(next);
    if (next) {
      ensureAudio();
      playChime();
    }
    try {
      await api("/api/admin/store", "PATCH", { sound_enabled: next });
    } catch {}
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              active ? "bg-orange-600 text-white shadow-sm shadow-orange-600/30" : "text-stone-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="size-[18px]" />
            <span className="flex-1">{label}</span>
            {href === "/admin" && !!pulse?.awaiting && (
              <span className={`grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${active ? "bg-white text-orange-700" : "bg-orange-600 text-white"}`}>
                {pulse.awaiting}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-stone-950 p-4 text-white">
      <div className="flex items-center gap-2.5 px-2 pb-5 pt-1">
        <span className="grid size-8 place-items-center rounded-lg bg-orange-600 text-xs font-extrabold">{BRAND.short}</span>
        <span className="font-extrabold">{BRAND.name}</span>
      </div>
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        {store.logo_url ? (
           
          <img src={store.logo_url} alt="" className="size-10 rounded-full bg-white object-cover" />
        ) : (
          <span className="grid size-10 place-items-center rounded-full bg-orange-600 font-bold">{store.name[0]}</span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{store.name}</p>
          <a href={`/${store.slug}`} target="_blank" className="flex items-center gap-1 text-xs text-orange-300 hover:underline">
            Ver cardápio <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
      {nav}
      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        <button onClick={toggleSound} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-300 hover:bg-white/5">
          {sound ? <Bell className="size-[18px]" /> : <BellOff className="size-[18px]" />}
          Som de pedidos: {sound ? "ligado" : "desligado"}
        </button>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-300 hover:bg-white/5">
          <LogOut className="size-[18px]" /> Sair
        </button>
        <p className="truncate px-3 pt-2 text-xs text-stone-500">{user.email}</p>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <PulseCtx.Provider value={{ pulse, version }}>
        <div className="min-h-dvh bg-stone-100/70">
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

          {/* topo no celular */}
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
            <button onClick={() => setMenuOpen(true)} className="relative rounded-lg p-1.5 hover:bg-stone-100" aria-label="Menu">
              <Menu className="size-6" />
              {!!pulse?.awaiting && <span className="absolute right-0 top-0 size-2.5 rounded-full bg-orange-600 ring-2 ring-white" />}
            </button>
            <span className="truncate font-bold">{store.name}</span>
            <button onClick={toggleSound} className="rounded-lg p-1.5 hover:bg-stone-100" aria-label="Som">
              {sound ? <Bell className="size-5" /> : <BellOff className="size-5 text-stone-400" />}
            </button>
          </header>
          {menuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 animate-fade bg-black/50" onClick={() => setMenuOpen(false)} />
              <div className="absolute inset-y-0 left-0 w-72 animate-slide-up">
                {sidebar}
                <button onClick={() => setMenuOpen(false)} className="absolute right-3 top-4 rounded-lg p-1 text-white/70" aria-label="Fechar">
                  <X className="size-5" />
                </button>
              </div>
            </div>
          )}

          <main className="lg:pl-64">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
          </main>

          {sound && !audioReady && (
            <div className="pointer-events-none fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-lg ring-1 ring-amber-200 lg:left-[17rem]">
              <Bell className="size-3.5" /> Clique na página para ativar o som de novos pedidos
            </div>
          )}

          {alert > 0 && (
            <div className="fixed inset-x-0 top-3 z-[70] flex justify-center px-4">
              <div className="flex animate-pop items-center gap-3 rounded-2xl bg-orange-600 py-3 pl-4 pr-3 text-white shadow-2xl shadow-orange-900/30">
                <Bell className="size-6 animate-ring" />
                <div>
                  <p className="font-extrabold">Novo pedido recebido!</p>
                  <p className="text-sm text-orange-100">Confira e confirme o recebimento.</p>
                </div>
                {path !== "/admin" && (
                  <Link href="/admin" onClick={() => setAlert(0)} className="ml-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-orange-700">
                    Ver pedidos
                  </Link>
                )}
                <button onClick={() => setAlert(0)} className="rounded-lg p-1.5 hover:bg-white/15" aria-label="Fechar aviso">
                  <X className="size-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </PulseCtx.Provider>
    </ToastProvider>
  );
}
