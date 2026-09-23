import {
  ArrowRight,
  Bell,
  Bike,
  Check,
  ClipboardList,
  ImagePlus,
  MessageCircle,
  Palette,
  QrCode,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { whatsappNumber } from "@/lib/format";

const FEATURES = [
  { icon: Palette, title: "A cara da sua marca", text: "Logo, banner, cores e fontes do seu jeito. Nada de cardápio genérico." },
  { icon: MessageCircle, title: "Pedido pronto no WhatsApp", text: "O cliente monta o pedido e envia a mensagem organizada, com itens, endereço e total." },
  { icon: ClipboardList, title: "Painel de pedidos", text: "Todos os pedidos numerados, com status: recebido, em preparo, saiu para entrega…" },
  { icon: Bell, title: "Aviso sonoro", text: "Chegou pedido? O painel toca um alerta e destaca o pedido novo na tela." },
  { icon: ImagePlus, title: "Fotos e preços em segundos", text: "Cadastre produtos, tamanhos, bordas e adicionais sem depender de ninguém." },
  { icon: QrCode, title: "Pix com QR Code", text: "Mostre sua chave e o QR Code Pix com o valor do pedido. O dinheiro cai direto na sua conta." },
  { icon: Bike, title: "Entrega por bairro", text: "Taxa por bairro, pedido mínimo, retirada no balcão e horários automáticos." },
  { icon: Smartphone, title: "Sem aplicativo", text: "Abre em qualquer celular pelo link. Rápido, leve e fácil para o seu cliente." },
];

const STEPS = [
  { n: "1", title: "Montamos seu cardápio", text: "Você recebe o acesso ao painel com o cardápio configurado com a sua marca." },
  { n: "2", title: "Compartilhe o link", text: "Coloque na bio do Instagram, no status do WhatsApp e no Google." },
  { n: "3", title: "Receba pedidos", text: "Os pedidos chegam organizados no painel e no seu WhatsApp. É só confirmar e preparar." },
];

const FAQ = [
  ["Preciso instalar algum aplicativo?", "Não. O cardápio abre pelo navegador do celular ou computador, a partir do seu link."],
  ["Vocês cobram comissão por pedido?", "Não. Você paga apenas o plano mensal, sem taxa sobre as vendas."],
  [
    "Como recebo os pagamentos?",
    "Direto do cliente: Pix na sua chave, dinheiro ou cartão na entrega. O sistema não intermedia pagamentos — você confirma o recebimento no seu banco.",
  ],
  ["Consigo alterar preços e fotos sozinho?", "Sim. Pelo painel você altera produtos, preços, fotos, horários, taxas e cores quando quiser, e o cardápio atualiza na hora."],
  ["Meus dados ficam separados das outras lojas?", "Sim. Cada estabelecimento tem login próprio e acesso somente aos próprios produtos, pedidos e configurações."],
];

export default function Home() {
  const demo = `/${BRAND.demoSlug}`;
  const sales = BRAND.salesWhatsapp
    ? `https://wa.me/${whatsappNumber(BRAND.salesWhatsapp)}?text=${encodeURIComponent(`Olá! Quero um cardápio digital para minha loja.`)}`
    : "#planos";

  return (
    <div className="bg-white text-stone-900">
      {/* ---------- topo ---------- */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <a href="/" className="flex items-center gap-2.5 text-lg font-extrabold text-white">
            <span className="grid size-9 place-items-center rounded-xl bg-orange-600 text-sm">{BRAND.short}</span>
            {BRAND.name}
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-stone-300 md:flex">
            <a href="#recursos" className="hover:text-white">
              Recursos
            </a>
            <a href="#como-funciona" className="hover:text-white">
              Como funciona
            </a>
            <a href="#planos" className="hover:text-white">
              Planos
            </a>
          </nav>
          <a href="/admin/login" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20">
            Entrar
          </a>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden bg-stone-950 text-white">
        { }
        <img src="/demo/banner-pizzaria.svg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/85 to-stone-950/30" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-32 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-36">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-300 ring-1 ring-orange-400/30">
              🍕 Para pizzarias, lanchonetes e restaurantes
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Seu cardápio online, com pedidos direto no <span className="text-orange-400">WhatsApp</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-stone-300">
              Um cardápio bonito, com a sua marca, que o cliente abre pelo celular, monta o pedido e envia pronto. E um painel simples para você
              administrar tudo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={demo} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 font-bold text-white shadow-lg shadow-orange-900/40 transition hover:bg-orange-500">
                Ver cardápio de demonstração <ArrowRight className="size-5" />
              </a>
              <a href={sales} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 font-bold ring-1 ring-white/25 transition hover:bg-white/20">
                Quero para minha loja
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-300">
              {["Sem comissão por pedido", "Sem aplicativo", "Atualização em tempo real"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-emerald-400" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* celular com a demonstração ao vivo */}
          <div className="relative mx-auto hidden w-[320px] lg:block">
            <div className="absolute -inset-10 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="relative rounded-[3rem] border-[10px] border-stone-800 bg-stone-800 shadow-2xl">
              <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-stone-900" />
              <iframe src={demo} title="Demonstração do cardápio" className="h-[640px] w-full rounded-[2.3rem] bg-white" loading="lazy" />
            </div>
            <p className="mt-4 text-center text-xs text-stone-400">Demonstração ao vivo — pode clicar e testar</p>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-100 bg-stone-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-6 text-sm font-semibold text-stone-500">
          {["Pizzarias", "Hamburguerias", "Lanchonetes", "Açaí", "Restaurantes", "Docerias", "Marmitarias"].map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </section>

      {/* ---------- recursos ---------- */}
      <section id="recursos" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Recursos</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Tudo que você precisa para vender online. Nada que complique.</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-stone-200 p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-200/60">
              <div className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- painel ---------- */}
      <section className="bg-stone-950 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-orange-400">Painel do lojista</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Controle total, sem precisar entender de tecnologia.</h2>
            <ul className="mt-6 space-y-3 text-stone-300">
              {[
                "Pedidos em tempo real com alerta sonoro",
                "Status do pedido que o cliente acompanha pelo link",
                "Cadastro de produtos com fotos, tamanhos e adicionais",
                "Marcar item como indisponível com um toque",
                "Login e senha individuais: cada loja vê só os próprios dados",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-emerald-400" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/admin/login" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-stone-900 hover:bg-stone-100">
                Acessar o painel <ArrowRight className="size-4" />
              </a>
            </div>
            {BRAND.showDemoLogin && (
              <p className="mt-4 text-sm text-stone-400">
                Painel de demonstração: <code className="rounded bg-white/10 px-1.5 py-0.5">admin@brasaemassa.demo</code> / senha{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5">pizza1234</code>
              </p>
            )}
          </div>
          {/* mock de pedido */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-orange-500/10 blur-2xl" />
            <div className="relative rounded-3xl bg-white p-5 text-stone-900 shadow-2xl ring-4 ring-orange-500/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-extrabold">#128</p>
                  <p className="text-xs text-stone-500">Hoje, 20:41 · Entrega</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                  <Bell className="size-3.5 animate-ring" /> Novo pedido
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>
                    <b>1x</b> Pepperoni Artesanal · Grande · Borda catupiry
                  </span>
                  <span>R$ 79,90</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    <b>1x</b> Refrigerante 2 litros · Guaraná
                  </span>
                  <span>R$ 15,00</span>
                </div>
                <p className="rounded-lg bg-amber-50 px-2 py-1 text-amber-900">Obs.: sem cebola, por favor</p>
                <div className="flex justify-between border-t border-dashed pt-2 text-base font-extrabold">
                  <span>Total</span>
                  <span>R$ 101,90</span>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-orange-600 py-2.5 text-center text-sm font-bold text-white">Confirmar recebimento</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- como funciona ---------- */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Como funciona</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">No ar em poucos dias.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-3xl bg-stone-50 p-7">
              <span className="grid size-10 place-items-center rounded-full bg-stone-900 font-extrabold text-white">{s.n}</span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-1.5 text-stone-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- planos ---------- */}
      <section id="planos" className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Planos</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Simples e sem comissão.</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
            {BRAND.plans.map((p) => (
              <div key={p.name} className={`relative flex flex-col rounded-3xl p-7 ${p.highlight ? "bg-stone-950 text-white shadow-2xl" : "bg-white ring-1 ring-stone-200"}`}>
                {p.highlight && <span className="absolute -top-3 left-7 rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">Mais escolhido</span>}
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className={`mt-1 text-sm ${p.highlight ? "text-stone-400" : "text-stone-500"}`}>{p.description}</p>
                <p className="mt-5 text-4xl font-extrabold tracking-tight">
                  {p.price}
                  <span className={`text-base font-medium ${p.highlight ? "text-stone-400" : "text-stone-500"}`}>{p.period}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className={`size-4 shrink-0 ${p.highlight ? "text-orange-400" : "text-emerald-600"}`} /> {f}
                    </li>
                  ))}
                </ul>
                <a href={sales} className={`mt-7 rounded-2xl py-3 text-center font-bold transition ${p.highlight ? "bg-orange-600 text-white hover:bg-orange-500" : "bg-stone-900 text-white hover:bg-stone-800"}`}>
                  Falar com a gente
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- perguntas ---------- */}
      <section className="mx-auto max-w-3xl px-5 py-20 lg:py-28">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">Perguntas frequentes</h2>
        <div className="mt-10 divide-y divide-stone-200 rounded-3xl border border-stone-200">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                {q}
                <span className="text-xl text-stone-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-stone-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-orange-600 px-8 py-14 text-center text-white">
          { }
          <img src="/demo/pizza-pepperoni.svg" alt="" className="absolute -right-20 -top-20 size-72 rounded-full opacity-25" />
          { }
          <img src="/demo/pizza-margherita.svg" alt="" className="absolute -bottom-24 -left-16 size-64 rounded-full opacity-25" />
          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">Pronto para receber pedidos pelo celular?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-orange-100">Veja como fica o cardápio da pizzaria de demonstração e imagine a sua marca no lugar.</p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={demo} className="rounded-2xl bg-white px-6 py-4 font-bold text-orange-700 hover:bg-orange-50">
              Abrir demonstração
            </a>
            <a href={sales} className="rounded-2xl bg-orange-700 px-6 py-4 font-bold hover:bg-orange-800">
              Quero para minha loja
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-100 py-8 text-center text-sm text-stone-500">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-4" /> {BRAND.name} · Cardápio digital para restaurantes
        </p>
      </footer>
    </div>
  );
}
