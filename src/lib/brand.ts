/** Identidade do SEU produto (a plataforma que você vende). Altere à vontade. */
export const BRAND = {
  name: "Cardápio Pronto",
  short: "CP",
  slogan: "Cardápio digital com pedidos pelo WhatsApp para o seu restaurante",
  /** WhatsApp comercial (para os botões "Quero para minha loja"). Configure em .env */
  salesWhatsapp: process.env.NEXT_PUBLIC_SALES_WHATSAPP || "",
  demoSlug: "brasa-e-massa",
  /** Planos exibidos na página comercial — ajuste aos seus preços reais. */
  plans: [
    {
      name: "Essencial",
      price: "R$ 79,90",
      period: "/mês",
      description: "Para começar a vender online.",
      features: ["Cardápio com sua marca", "Pedidos pelo WhatsApp", "Até 60 produtos", "Painel de pedidos"],
      highlight: false,
    },
    {
      name: "Profissional",
      price: "R$ 139,90",
      period: "/mês",
      description: "Tudo para a operação de delivery.",
      features: ["Produtos ilimitados", "Taxa de entrega por bairro", "QR Code Pix automático", "Alerta sonoro de pedidos", "Suporte prioritário"],
      highlight: true,
    },
    {
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
