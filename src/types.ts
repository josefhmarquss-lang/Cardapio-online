export interface ProductExtra {
  id: string;
  name: string;
  price: number;
}

export type ProductImageType = 'real' | 'illustrative' | 'placeholder';

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price: number;
  originalPrice?: number;
  isHighlight?: boolean;
  isBestSeller?: boolean;
  image: string;
  imageType?: ProductImageType;
  badge?: string;
  available: boolean;
  extras?: ProductExtra[];
  allowsNotes?: boolean;
  servingSize?: string;
  preparationTime?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
  order?: number;
}

export interface CartItemExtra {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedExtras: CartItemExtra[];
  notes?: string;
  itemTotal: number;
}

export type DeliveryType = 'delivery' | 'retirada' | 'mesa';
export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro';

export interface DaySchedule {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  dayLabel: string;
  isOpen: boolean;
  openTime: string; // e.g. "18:00"
  closeTime: string; // e.g. "23:30"
}

export type VisualTheme = 'dark-amber' | 'vibrant-orange' | 'clean-light' | 'dark-emerald';

export interface EstablishmentInfo {
  name: string;
  subtitle: string;
  city: string;
  state: string;
  address: string;
  neighborhood: string;
  mapsUrl: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  openingHoursText: string;
  schedule: DaySchedule[];
  statusMode: 'auto' | 'forced_open' | 'forced_closed';
  deliveryEstimate: string;
  pickupEstimate: string;
  deliveryFee: number;
  freeDeliveryAbove?: number;
  minimumOrder: number;
  pixKey: string;
  pixKeyType: string;
  pixBeneficiary: string;
  visualTheme: VisualTheme;
  logoUrl?: string;
  isDemoMode: boolean;
  adminPin?: string;
}

export interface OrderFormState {
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  reference: string;
  tableNumber: string;
  paymentMethod: PaymentMethod;
  needsChange: boolean;
  changeFor: string;
  generalNotes: string;
}

export interface RegisteredOrder {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryType: DeliveryType;
  itemsSummary: string;
  total: number;
  paymentMethod: PaymentMethod;
  status: 'recebido' | 'em_preparo' | 'saiu_para_entrega' | 'concluido' | 'cancelado';
}
