import { PLANS } from "./plans";

const price = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

/** Identidade do SEU produto (a plataforma que você vende). Altere à vontade. */
export const BRAND = {
  name: "Cardápio Pronto",
  short: "CP",
  slogan: "Cardápio digital com pedidos pelo WhatsApp para o seu restaurante",
  /** WhatsApp comercial (para os botões "Quero para minha loja"). Configure em .env */
  salesWhatsapp: process.env.NEXT_PUBLIC_SALES_WHATSAPP || "",
  demoSlug: "brasa-e-massa",
  /** Planos exibidos na página comercial. Preços e limites ficam em src/lib/plans.ts. */
  plans: [
    {
      id: "essencial" as const,
      name: "Essencial",
      price: price(PLANS.essencial.price_cents),
      period: "/mês",
      description: "Para começar a vender online.",
      features: ["Cardápio com sua marca", "Pedidos pelo WhatsApp", `Até ${PLANS.essencial.max_products} produtos`, "Painel de pedidos"],
      highlight: false,
    },
    {
      id: "profissional" as const,
      name: "Profissional",
      price: price(PLANS.profissional.price_cents),
      period: "/mês",
      description: "Tudo para a operação de delivery.",
      features: ["Produtos ilimitados", "Taxa de entrega por bairro", "QR Code Pix automático", "Alerta sonoro de pedidos", "Suporte prioritário"],
      highlight: true,
    },
    {
      id: null,
      name: "Redes",
      price: "Sob consulta",
      period: "",
      description: "Várias unidades ou marcas.",
      features: ["Um cardápio por unidade", "Acessos separados", "Configuração assistida"],
      highlight: false,
    },
  ],
  /** Mostrar login/senha do painel de demonstração na página comercial (defina no .env). */
  showDemoLogin: process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true",
};
