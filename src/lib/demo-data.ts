import type { DayHours, DeliveryZone, OptionGroup, Store } from "./types";

/**
 * Conteúdo da pizzaria fictícia usada na demonstração. Tudo aqui é apenas o
 * ponto de partida: depois de criado, cada dado é editável pelo painel.
 */

const R = (v: number) => Math.round(v * 100);

const tamanho = (extraGrande = 12, extraGigante = 24): OptionGroup => ({
  id: "tam",
  name: "Tamanho",
  min: 1,
  max: 1,
  items: [
    { id: "media", name: "Média (6 fatias)", price_cents: 0 },
    { id: "grande", name: "Grande (8 fatias)", price_cents: R(extraGrande) },
    { id: "gigante", name: "Gigante (12 fatias)", price_cents: R(extraGigante) },
  ],
});

const bordaSalgada: OptionGroup = {
  id: "borda",
  name: "Borda recheada",
  min: 0,
  max: 1,
  items: [
    { id: "catupiry", name: "Catupiry", price_cents: R(9) },
    { id: "cheddar", name: "Cheddar", price_cents: R(9) },
    { id: "cream", name: "Cream cheese", price_cents: R(10) },
  ],
};

const bordaDoce: OptionGroup = {
  id: "borda",
  name: "Borda recheada",
  min: 0,
  max: 1,
  items: [
    { id: "choc", name: "Chocolate", price_cents: R(10) },
    { id: "docedeleite", name: "Doce de leite", price_cents: R(10) },
  ],
};

const adicionais: OptionGroup = {
  id: "adic",
  name: "Adicionais",
  min: 0,
  max: 4,
  items: [
    { id: "mucarela", name: "Extra muçarela", price_cents: R(8) },
    { id: "bacon", name: "Bacon", price_cents: R(7) },
    { id: "catupiry", name: "Catupiry", price_cents: R(7) },
    { id: "cebola", name: "Cebola caramelizada", price_cents: R(6) },
    { id: "azeitona", name: "Azeitonas", price_cents: R(4) },
  ],
};

const salgada = [tamanho(), bordaSalgada, adicionais];
const doce = [tamanho(10, 20), bordaDoce];

export type SeedProduct = {
  name: string;
  description: string;
  price: number;
  image: string;
  tag?: string;
  featured?: boolean;
  unavailable?: boolean;
  options?: OptionGroup[];
};

export const DEMO_MENU: { name: string; description: string; products: SeedProduct[] }[] = [
  {
    name: "Pizzas Tradicionais",
    description: "Massa de fermentação natural (48h), assada no forno a lenha.",
    products: [
      {
        name: "Margherita",
        description: "Molho de tomate italiano, muçarela de búfala, tomate fresco, manjericão e azeite extravirgem.",
        price: 49.9,
        image: "/demo/pizza-margherita.svg",
        tag: "Clássica",
        featured: true,
        options: salgada,
      },
      {
        name: "Calabresa",
        description: "Calabresa artesanal fatiada, cebola roxa, azeitonas pretas e orégano.",
        price: 46.9,
        image: "/demo/pizza-calabresa.svg",
        options: salgada,
      },
      {
        name: "Muçarela",
        description: "Muçarela gratinada, rodelas de tomate, azeitonas pretas e orégano.",
        price: 44.9,
        image: "/demo/pizza-mucarela.svg",
        options: salgada,
      },
      {
        name: "Portuguesa",
        description: "Presunto, ovos, cebola, ervilha, azeitonas e muçarela.",
        price: 52.9,
        image: "/demo/pizza-portuguesa.svg",
        options: salgada,
      },
      {
        name: "Frango com Catupiry",
        description: "Frango desfiado temperado na casa, Catupiry original e azeitonas.",
        price: 52.9,
        image: "/demo/pizza-frango-catupiry.svg",
        featured: true,
        options: salgada,
      },
      {
        name: "Quatro Queijos",
        description: "Muçarela, provolone, gorgonzola e parmesão.",
        price: 54.9,
        image: "/demo/pizza-quatro-queijos.svg",
        options: salgada,
      },
    ],
  },
  {
    name: "Pizzas Especiais",
    description: "Receitas autorais do nosso pizzaiolo.",
    products: [
      {
        name: "Pepperoni Artesanal",
        description: "Pepperoni curado, muçarela fior di latte e um toque de mel picante.",
        price: 58.9,
        image: "/demo/pizza-pepperoni.svg",
        tag: "Mais pedida",
        featured: true,
        options: salgada,
      },
      {
        name: "Parma com Rúcula",
        description: "Presunto parma, rúcula fresca, tomate seco e lascas de parmesão.",
        price: 64.9,
        image: "/demo/pizza-parma-rucula.svg",
        tag: "Do chef",
        featured: true,
        options: salgada,
      },
      {
        name: "Caipira",
        description: "Frango desfiado, milho, bacon crocante e Catupiry.",
        price: 56.9,
        image: "/demo/pizza-caipira.svg",
        options: salgada,
      },
      {
        name: "Funghi Trufada",
        description: "Mix de cogumelos salteados, muçarela, rúcula e azeite trufado.",
        price: 62.9,
        image: "/demo/pizza-funghi.svg",
        unavailable: true,
        options: salgada,
      },
    ],
  },
  {
    name: "Pizzas Doces",
    description: "Para fechar a noite com chave de ouro.",
    products: [
      {
        name: "Chocolate com Morango",
        description: "Chocolate ao leite, morangos frescos e fios de chocolate branco.",
        price: 49.9,
        image: "/demo/pizza-chocolate-morango.svg",
        tag: "Nova",
        options: doce,
      },
      {
        name: "Banana com Canela",
        description: "Banana, açúcar mascavo, canela e chocolate ao leite.",
        price: 44.9,
        image: "/demo/pizza-banana-canela.svg",
        options: doce,
      },
      {
        name: "Romeu e Julieta",
        description: "Muçarela e goiabada cascão derretida.",
        price: 46.9,
        image: "/demo/pizza-romeu-julieta.svg",
        options: doce,
      },
    ],
  },
  {
    name: "Bebidas",
    description: "",
    products: [
      {
        name: "Refrigerante lata 350 ml",
        description: "Bem gelado.",
        price: 7,
        image: "/demo/bebida-lata.svg",
        options: [
          {
            id: "sabor",
            name: "Sabor",
            min: 1,
            max: 1,
            items: [
              { id: "cola", name: "Cola", price_cents: 0 },
              { id: "cola0", name: "Cola zero", price_cents: 0 },
              { id: "guarana", name: "Guaraná", price_cents: 0 },
              { id: "laranja", name: "Laranja", price_cents: 0 },
            ],
          },
        ],
      },
      {
        name: "Refrigerante 2 litros",
        description: "Ideal para dividir.",
        price: 15,
        image: "/demo/bebida-2l.svg",
        options: [
          {
            id: "sabor",
            name: "Sabor",
            min: 1,
            max: 1,
            items: [
              { id: "cola", name: "Cola", price_cents: 0 },
              { id: "guarana", name: "Guaraná", price_cents: 0 },
            ],
          },
        ],
      },
      {
        name: "Suco natural 500 ml",
        description: "Feito na hora, sem conservantes.",
        price: 12,
        image: "/demo/bebida-suco.svg",
        options: [
          {
            id: "sabor",
            name: "Sabor",
            min: 1,
            max: 1,
            items: [
              { id: "laranja", name: "Laranja", price_cents: 0 },
              { id: "limao", name: "Limão", price_cents: 0 },
              { id: "maracuja", name: "Maracujá", price_cents: 0 },
            ],
          },
          { id: "acucar", name: "Açúcar", min: 0, max: 1, items: [{ id: "sem", name: "Sem açúcar", price_cents: 0 }] },
        ],
      },
      {
        name: "Água mineral 500 ml",
        description: "",
        price: 4.5,
        image: "/demo/bebida-agua.svg",
        options: [
          {
            id: "tipo",
            name: "Tipo",
            min: 1,
            max: 1,
            items: [
              { id: "sem", name: "Sem gás", price_cents: 0 },
              { id: "com", name: "Com gás", price_cents: R(0.5) },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Sobremesas",
    description: "",
    products: [
      {
        name: "Petit gâteau com sorvete",
        description: "Bolinho de chocolate com recheio cremoso e sorvete de creme.",
        price: 22.9,
        image: "/demo/sobremesa-petit-gateau.svg",
      },
      {
        name: "Brownie com sorvete",
        description: "Brownie de chocolate meio amargo, sorvete e calda quente.",
        price: 18.9,
        image: "/demo/sobremesa-brownie.svg",
      },
      {
        name: "Pudim de leite",
        description: "Fatia generosa com calda de caramelo.",
        price: 12.9,
        image: "/demo/sobremesa-pudim.svg",
      },
    ],
  },
];

const hours: DayHours[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: "18:00",
  close: day === 5 || day === 6 ? "00:30" : "23:30",
  closed: day === 1,
}));

const zones: DeliveryZone[] = [
  { id: "z1", name: "Vila Madalena", fee_cents: R(5) },
  { id: "z2", name: "Pinheiros", fee_cents: R(7) },
  { id: "z3", name: "Sumaré", fee_cents: R(8) },
  { id: "z4", name: "Perdizes", fee_cents: R(9) },
  { id: "z5", name: "Alto de Pinheiros", fee_cents: R(10) },
];

export const DEMO_STORE: Partial<Store> = {
  name: "Brasa & Massa",
  tagline: "Pizzaria artesanal · forno a lenha · massa de longa fermentação",
  about:
    "Desde 2012 assando pizzas no forno a lenha com massa de fermentação natural e ingredientes selecionados. (Estabelecimento fictício de demonstração.)",
  logo_url: "/demo/logo-pizzaria.svg",
  banner_url: "/demo/banner-pizzaria.svg",
  primary_color: "#B7291C",
  accent_color: "#F2B138",
  background_color: "#FBF6EE",
  font_style: "classic",
  whatsapp: "(11) 90000-0000",
  phone: "(11) 3000-0000",
  instagram: "@brasaemassa.demo",
  address_street: "Rua das Oliveiras",
  address_number: "250",
  address_complement: "",
  address_neighborhood: "Vila Madalena",
  address_city: "São Paulo",
  address_state: "SP",
  address_zip: "05400-000",
  opening_hours: hours,
  open_mode: "open",
  delivery_enabled: true,
  pickup_enabled: true,
  delivery_fee_cents: R(6),
  delivery_zones: zones,
  min_order_cents: R(30),
  delivery_time: "40–60 min",
  pickup_time: "20–30 min",
  delivery_info: "Entregamos em embalagem térmica. Pedidos após as 23h podem demorar um pouco mais.",
  pay_pix: true,
  pay_cash: true,
  pay_card: true,
  pix_key: "pix@brasaemassa.exemplo",
  pix_key_type: "email",
  pix_receiver_name: "Brasa e Massa Pizzaria",
  pix_qr_url: "/demo/qrcode-exemplo.svg",
  payment_instructions:
    "Pague via Pix e envie o comprovante pelo WhatsApp. O pedido entra em preparo após a confirmação do pagamento pela pizzaria.",
};
