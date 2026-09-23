"use client";

import { Bike, ChevronRight, Clock, Info, MapPin, Search, ShoppingBag, Store as StoreIcon, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { money } from "@/lib/format";
import { isOpenNow, todayHoursLabel } from "@/lib/hours";
import type { Product } from "@/lib/types";
import { CartSheet } from "./CartSheet";
import { hasPriceVariation, lineKey, minPrice, sanitizeCart, unitPrice } from "./cart-utils";
import { ProductSheet } from "./ProductSheet";
import { StoreInfoSheet } from "./StoreInfoSheet";
import type { CartLine, MenuCategory, PublicStore } from "./types";

export function MenuApp({ store, menu, initialOpen, preview = false }: { store: PublicStore; menu: MenuCategory[]; initialOpen: boolean; preview?: boolean }) {
  const products = useMemo(() => new Map(menu.flatMap((c) => c.products).map((p) => [p.id, p])), [menu]);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [activeCat, setActiveCat] = useState<number | null>(menu[0]?.id ?? null);
  const [toast, setToast] = useState("");
  const cartKey = `carrinho:${store.slug}`;

  // carrinho salvo no aparelho
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cartKey);
      if (raw) setLines(sanitizeCart(JSON.parse(raw), products));
    } catch {}
    setLoaded(true);
  }, [cartKey, products]);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(lines));
    } catch {}
  }, [lines, loaded, cartKey]);

  // reavalia se a loja está aberta a cada minuto
  useEffect(() => {
    const t = setInterval(() => setIsOpen(isOpenNow(store.opening_hours, store.open_mode, store.timezone)), 60_000);
    return () => clearInterval(t);
  }, [store]);

  const closedMessage =
    store.open_mode === "closed"
      ? "Estamos fechados no momento. Volte em breve!"
      : `Estamos fechados agora. ${todayHoursLabel(store.opening_hours, store.timezone)}.`;

  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = lines.reduce((s, l) => {
    const p = products.get(l.product_id);
    return p ? s + unitPrice(p, l.option_ids) * l.quantity : s;
  }, 0);

  const addToCart = useCallback(
    (p: Product, optionIds: string[], qty: number, notes: string) => {
      const key = lineKey(p.id, optionIds, notes);
      setLines((prev) => {
        const found = prev.find((l) => l.key === key);
        if (found) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, l.quantity + qty) } : l));
        return [...prev, { key, product_id: p.id, quantity: qty, option_ids: optionIds, notes }];
      });
      setSelected(null);
      setToast(`${qty}x ${p.name} adicionado`);
      setTimeout(() => setToast(""), 2200);
    },
    [],
  );

  const setQty = (key: string, qty: number) =>
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: qty } : l))));

  // destaque da categoria visível no menu fixo
  const navRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActiveCat(Number((vis.target as HTMLElement).dataset.cat));
      },
      { rootMargin: "-120px 0px -65% 0px" },
    );
    document.querySelectorAll("[data-cat]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [menu, query]);
  useEffect(() => {
    const el = navRef.current?.querySelector(`[data-nav="${activeCat}"]`) as HTMLElement | null;
    if (el && navRef.current) navRef.current.scrollTo({ left: el.offsetLeft - navRef.current.offsetLeft - 16, behavior: "smooth" });
  }, [activeCat]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? menu
        .map((c) => ({ ...c, products: c.products.filter((p) => (p.name + " " + p.description).toLowerCase().includes(q)) }))
        .filter((c) => c.products.length)
    : menu;
  const featured = menu.flatMap((c) => c.products).filter((p) => p.is_featured && p.is_available);
  const fontClass = `font-store-${store.font_style}`;

  return (
    <div className="min-h-dvh bg-page pb-28 text-ink-main">
      {preview && (
        <div className="sticky top-0 z-40 bg-stone-900 px-4 py-2 text-center text-xs font-medium text-white">
          Pré-visualização do cardápio público
        </div>
      )}

      {/* ---------- capa ---------- */}
      <header className="relative">
        <div className="relative h-44 w-full overflow-hidden bg-brand sm:h-64 lg:h-80">
          {store.banner_url && (
             
            <img src={store.banner_url} alt="" className="h-full w-full object-cover" fetchPriority="high" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
        </div>
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative -mt-14 flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-xl shadow-black/5 ring-1 ring-line sm:-mt-20 sm:flex-row sm:items-center sm:p-6">
            <div className="-mt-14 size-24 shrink-0 overflow-hidden rounded-full border-4 border-card bg-white shadow-lg sm:mt-0 sm:size-28">
              {store.logo_url ? (
                 
                <img src={store.logo_url} alt={`Logo ${store.name}`} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-brand text-3xl font-black text-brand-fg">{store.name.slice(0, 1)}</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={`${fontClass} text-[1.75rem] font-bold leading-tight sm:text-4xl`}>{store.name}</h1>
              {store.tagline && <p className="mt-1 text-sm text-ink-soft sm:text-base">{store.tagline}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
                    isOpen ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"
                  }`}
                >
                  <span className={`size-2 rounded-full ${isOpen ? "bg-emerald-500" : "bg-stone-500"}`} />
                  {isOpen ? "Aberto agora" : "Fechado"}
                </span>
                {store.open_mode === "auto" && (
                  <span className="inline-flex items-center gap-1 text-ink-soft">
                    <Clock className="size-3.5" /> {todayHoursLabel(store.opening_hours, store.timezone)}
                  </span>
                )}
                {store.delivery_enabled && store.delivery_time && (
                  <span className="inline-flex items-center gap-1 text-ink-soft">
                    <Bike className="size-3.5" /> {store.delivery_time}
                  </span>
                )}
                {store.pickup_enabled && (
                  <span className="inline-flex items-center gap-1 text-ink-soft">
                    <StoreIcon className="size-3.5" /> Retirada
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setInfoOpen(true)}
              className="flex items-center justify-between gap-2 rounded-2xl border border-line px-4 py-3 text-left text-sm transition hover:bg-black/[.03] sm:w-64"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Info className="size-4 text-brand" /> Informações da loja
                </span>
                {store.address_street && (
                  <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-soft">
                    <MapPin className="size-3 shrink-0" /> {store.address_neighborhood || store.address_street}
                    {store.address_city && `, ${store.address_city}`}
                  </span>
                )}
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-soft" />
            </button>
          </div>

          {!isOpen && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-stone-900 px-4 py-3 text-sm text-white">
              <Clock className="size-5 shrink-0 text-accent" />
              <span>{closedMessage} Você pode ver o cardápio normalmente.</span>
            </div>
          )}
        </div>
      </header>

      {/* ---------- navegação por categorias ---------- */}
      <nav className="sticky top-0 z-30 mt-5 border-b border-line bg-page/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
          {searching ? (
            <div className="flex flex-1 items-center gap-2 rounded-full bg-card px-4 py-2 ring-1 ring-line">
              <Search className="size-4 text-ink-soft" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar no cardápio"
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-soft"
              />
              <button
                onClick={() => {
                  setQuery("");
                  setSearching(false);
                }}
                aria-label="Fechar busca"
              >
                <X className="size-4 text-ink-soft" />
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setSearching(true)} className="grid size-9 shrink-0 place-items-center rounded-full bg-card ring-1 ring-line" aria-label="Buscar">
                <Search className="size-4" />
              </button>
              <div ref={navRef} className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto scroll-smooth">
                {menu.map((c) => (
                  <a
                    key={c.id}
                    data-nav={c.id}
                    href={`#cat-${c.id}`}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeCat === c.id ? "bg-brand text-brand-fg shadow" : "text-ink-soft hover:bg-black/5"
                    }`}
                  >
                    {c.name}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4">
        {/* ---------- destaques ---------- */}
        {!q && featured.length > 0 && (
          <section className="pt-6">
            <h2 className={`${fontClass} mb-3 text-xl font-bold`}>Destaques da casa</h2>
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {featured.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="group w-44 shrink-0 snap-start overflow-hidden rounded-2xl bg-card text-left shadow-sm ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-md sm:w-52"
                >
                  <div className="relative aspect-square overflow-hidden bg-stone-100">
                    {p.image_url && (
                       
                      <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    )}
                    {p.tag && <span className="absolute left-2 top-2 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-fg shadow">{p.tag}</span>}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 font-bold">{p.name}</p>
                    <p className="text-sm font-semibold text-brand">
                      {hasPriceVariation(p) && <span className="text-xs font-normal text-ink-soft">a partir de </span>}
                      {money(minPrice(p))}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ---------- categorias ---------- */}
        {filtered.length === 0 && <p className="py-16 text-center text-ink-soft">Nenhum produto encontrado para “{query}”.</p>}
        {filtered.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} data-cat={c.id} className="scroll-mt-20 pt-8">
            <h2 className={`${fontClass} text-2xl font-bold`}>{c.name}</h2>
            {c.description && <p className="mt-0.5 text-sm text-ink-soft">{c.description}</p>}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {c.products.map((p) => (
                <ProductCard key={p.id} p={p} onOpen={() => p.is_available && setSelected(p)} />
              ))}
            </div>
          </section>
        ))}

        <footer className="mt-16 border-t border-line py-8 text-center text-xs text-ink-soft">
          <p className="font-semibold">{store.name}</p>
          <p className="mt-1">Pedidos confirmados diretamente pelo estabelecimento.</p>
        </footer>
      </main>

      {/* ---------- barra do carrinho ---------- */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-lg animate-slide-up items-center gap-3 rounded-2xl bg-brand px-4 py-3.5 font-bold text-brand-fg shadow-2xl shadow-black/25"
          >
            <span className="relative">
              <ShoppingBag className="size-6" />
              <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-accent text-[11px] text-accent-fg">{count}</span>
            </span>
            <span className="flex-1 text-left">Ver carrinho</span>
            <span className="tabular-nums">{money(subtotal)}</span>
          </button>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
          <div className="animate-pop rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl">✓ {toast}</div>
        </div>
      )}

      <ProductSheet product={selected} canOrder={isOpen} closedMessage={closedMessage} onClose={() => setSelected(null)} onAdd={addToCart} />
      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        store={store}
        lines={lines}
        products={products}
        canOrder={isOpen}
        closedMessage={closedMessage}
        setQty={setQty}
        clear={() => setLines([])}
      />
      <StoreInfoSheet store={store} open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}

function ProductCard({ p, onOpen }: { p: Product; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      disabled={!p.is_available}
      className="group flex w-full gap-4 rounded-2xl bg-card p-3.5 text-left shadow-sm ring-1 ring-line transition enabled:hover:shadow-md enabled:active:scale-[.99] disabled:cursor-not-allowed"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className={`font-bold leading-snug ${p.is_available ? "" : "text-ink-soft"}`}>{p.name}</h3>
          {p.tag && p.is_available && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-ink-main">{p.tag}</span>}
        </div>
        {p.description && <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink-soft">{p.description}</p>}
        <div className="mt-auto pt-2">
          {p.is_available ? (
            <p className="font-bold text-brand">
              {hasPriceVariation(p) && <span className="text-xs font-medium text-ink-soft">a partir de </span>}
              {money(minPrice(p))}
            </p>
          ) : (
            <span className="inline-block rounded-md bg-stone-200 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-stone-600">Indisponível</span>
          )}
        </div>
      </div>
      <div className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:size-32">
        {p.image_url && (
           
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-500 group-enabled:group-hover:scale-105 ${p.is_available ? "" : "opacity-50 grayscale"}`}
          />
        )}
        {p.is_available && (
          <span className="absolute bottom-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-white text-xl font-bold leading-none text-brand shadow-md">+</span>
        )}
      </div>
    </button>
  );
}
