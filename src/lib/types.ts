export type OptionItem = { id: string; name: string; price_cents: number };

/** Grupo de opções/adicionais de um produto (ex.: "Tamanho", "Borda", "Adicionais"). */
export type OptionGroup = {
  id: string;
  name: string;
  /** mínimo de escolhas (1 = obrigatório) */
  min: number;
  /** máximo de escolhas */
  max: number;
  items: OptionItem[];
};

/** day: 0 = domingo ... 6 = sábado. Fechamento antes da abertura = vira a madrugada. */
export type DayHours = { day: number; open: string; close: string; closed: boolean };

export type DeliveryZone = { id: string; name: string; fee_cents: number };

export type OpenMode = "auto" | "open" | "closed";
export type FontStyle = "modern" | "classic" | "rustic";
export type PaymentMethod = "pix" | "cash" | "card";
export type Fulfillment = "delivery" | "pickup";
export type OrderStatus = "new" | "received" | "preparing" | "out_for_delivery" | "completed" | "cancelled";

export type Store = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  about: string;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  accent_color: string;
  background_color: string;
  font_style: FontStyle;
  whatsapp: string;
  phone: string;
  instagram: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  opening_hours: DayHours[];
  open_mode: OpenMode;
  timezone: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_fee_cents: number;
  delivery_zones: DeliveryZone[];
  min_order_cents: number;
  delivery_time: string;
  pickup_time: string;
  delivery_info: string;
  pay_pix: boolean;
  pay_cash: boolean;
  pay_card: boolean;
  pix_key: string;
  pix_key_type: string;
  pix_receiver_name: string;
  pix_qr_url: string | null;
  payment_instructions: string;
  sound_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: number;
  store_id: number;
  name: string;
  description: string;
  position: number;
  is_active: boolean;
};

export type Product = {
  id: number;
  store_id: number;
  category_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  tag: string;
  option_groups: OptionGroup[];
  position: number;
};

export type OrderItemOption = { group: string; name: string; price_cents: number };

export type OrderItem = {
  id: number;
  product_id: number | null;
  name: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  options: OrderItemOption[];
  notes: string;
};

export type Order = {
  id: number;
  store_id: number;
  number: number;
  public_token: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  fulfillment: Fulfillment;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_reference: string;
  payment_method: PaymentMethod;
  change_for_cents: number | null;
  notes: string;
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  seen: boolean;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
};

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "owner" | "superadmin";
  store_id: number | null;
};
