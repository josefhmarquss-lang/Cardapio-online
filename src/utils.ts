import { CartItem, DaySchedule, EstablishmentInfo, OrderFormState, VisualTheme } from './types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

/**
 * Calculates the total sum of extras with two decimal places precision.
 */
export const calculateExtrasTotal = (extras?: { price?: number }[]): number => {
  if (!extras || extras.length === 0) return 0;
  const sum = extras.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  return Math.round(sum * 100) / 100;
};

/**
 * Calculates the unit price for a product including all selected extras.
 * Product without extras = base price.
 * Product with extras = base price + sum of all extras.
 */
export const calculateItemUnitPrice = (
  productPrice: number,
  extras?: { price?: number }[]
): number => {
  const base = Number(productPrice) || 0;
  const extrasSum = calculateExtrasTotal(extras);
  return Math.round((base + extrasSum) * 100) / 100;
};

/**
 * Calculates the total price for a cart item: (Product Price + Sum of Extras) * Quantity.
 */
export const calculateItemTotal = (
  productPrice: number,
  extras?: { price?: number }[],
  quantity: number = 1
): number => {
  const unitPrice = calculateItemUnitPrice(productPrice, extras);
  const safeQty = Math.max(1, Math.floor(Number(quantity) || 1));
  return Math.round(unitPrice * safeQty * 100) / 100;
};

/**
 * Calculates the subtotal of all items in the cart.
 */
export const calculateCartSubtotal = (items: CartItem[]): number => {
  if (!items || items.length === 0) return 0;
  const subtotal = items.reduce((acc, item) => {
    const itemTotal = calculateItemTotal(
      item.product?.price || 0,
      item.selectedExtras,
      item.quantity
    );
    return acc + itemTotal;
  }, 0);
  return Math.round(subtotal * 100) / 100;
};

/**
 * Calculates the final total: Subtotal + Delivery Fee - Discount.
 * Delivery fee is added strictly after subtotal.
 */
export const calculateOrderTotal = (
  subtotal: number,
  deliveryFee: number = 0,
  discount: number = 0
): number => {
  const safeSubtotal = Number(subtotal) || 0;
  const safeDelivery = Number(deliveryFee) || 0;
  const safeDiscount = Number(discount) || 0;
  const total = Math.max(0, safeSubtotal + safeDelivery - safeDiscount);
  return Math.round(total * 100) / 100;
};

export interface EstablishmentStatusResult {
  isOpen: boolean;
  statusText: string;
  badgeColor: 'emerald' | 'amber' | 'rose';
  nextScheduleInfo?: string;
}

/**
 * Computes whether the establishment is open or closed based on current time,
 * weekly schedule, and manual override mode.
 */
export const getEstablishmentStatus = (
  info: EstablishmentInfo,
  currentDate: Date = new Date()
): EstablishmentStatusResult => {
  if (info.statusMode === 'forced_open') {
    return {
      isOpen: true,
      statusText: 'Aberto Agora (Modo Ativo)',
      badgeColor: 'emerald',
    };
  }

  if (info.statusMode === 'forced_closed') {
    return {
      isOpen: false,
      statusText: 'Fechado no Momento',
      badgeColor: 'rose',
      nextScheduleInfo: 'Atendimento temporariamente pausado pela loja',
    };
  }

  // Automatic schedule check
  const currentDay = currentDate.getDay(); // 0 = Domingo, 1 = Segunda, ...
  const scheduleForToday = info.schedule?.find((s) => s.dayOfWeek === currentDay);

  if (!scheduleForToday || !scheduleForToday.isOpen) {
    // Find next open day
    const nextOpen = info.schedule?.find((s) => s.isOpen);
    return {
      isOpen: false,
      statusText: 'Fechado Hoje',
      badgeColor: 'amber',
      nextScheduleInfo: nextOpen ? `Abre ${nextOpen.dayLabel} às ${nextOpen.openTime}` : info.openingHoursText,
    };
  }

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  const [openH, openM] = scheduleForToday.openTime.split(':').map(Number);
  const [closeH, closeM] = scheduleForToday.closeTime.split(':').map(Number);

  const openMinutes = openH * 60 + (openM || 0);
  let closeMinutes = closeH * 60 + (closeM || 0);

  // If closes past midnight (e.g. 01:00 or 23:59)
  if (closeMinutes < openMinutes) {
    // Overnight operation
    const isOpenNow = currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    if (isOpenNow) {
      return {
        isOpen: true,
        statusText: `Aberto Agora • Até ${scheduleForToday.closeTime}`,
        badgeColor: 'emerald',
      };
    }
  } else {
    // Standard same-day operation
    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      return {
        isOpen: true,
        statusText: `Aberto Agora • Até ${scheduleForToday.closeTime}`,
        badgeColor: 'emerald',
      };
    }
  }

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      statusText: `Fechado no Momento`,
      badgeColor: 'amber',
      nextScheduleInfo: `Abre hoje às ${scheduleForToday.openTime}`,
    };
  }

  return {
    isOpen: false,
    statusText: 'Fechado no Momento',
    badgeColor: 'amber',
    nextScheduleInfo: info.openingHoursText,
  };
};

/**
 * Returns theme-specific styling attributes
 */
export const getThemeConfig = (theme: VisualTheme) => {
  switch (theme) {
    case 'vibrant-orange':
      return {
        bg: 'bg-zinc-950',
        cardBg: 'bg-zinc-900/90',
        primary: 'from-orange-500 via-amber-500 to-red-500',
        primarySolid: 'bg-orange-500 hover:bg-orange-400 text-zinc-950',
        accentText: 'text-orange-400',
        badgeBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        borderFocus: 'focus:border-orange-500',
        glow: 'bg-orange-500/10',
      };
    case 'clean-light':
      return {
        bg: 'bg-slate-50',
        cardBg: 'bg-white',
        primary: 'from-amber-600 to-orange-600',
        primarySolid: 'bg-amber-600 hover:bg-amber-500 text-white',
        accentText: 'text-amber-700',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
        borderFocus: 'focus:border-amber-600',
        glow: 'bg-amber-500/5',
      };
    case 'dark-emerald':
      return {
        bg: 'bg-zinc-950',
        cardBg: 'bg-zinc-900/90',
        primary: 'from-emerald-500 via-teal-500 to-emerald-600',
        primarySolid: 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950',
        accentText: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        borderFocus: 'focus:border-emerald-500',
        glow: 'bg-emerald-500/10',
      };
    case 'dark-amber':
    default:
      return {
        bg: 'bg-zinc-950',
        cardBg: 'bg-zinc-900/90',
        primary: 'from-amber-500 via-orange-500 to-amber-500',
        primarySolid: 'bg-amber-500 hover:bg-amber-400 text-zinc-950',
        accentText: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        borderFocus: 'focus:border-amber-500',
        glow: 'bg-amber-500/10',
      };
  }
};

/**
 * Builds standard, structured WhatsApp message for store orders
 */
export const generateWhatsAppMessage = (
  items: CartItem[],
  form: OrderFormState,
  establishment: EstablishmentInfo,
  subtotal: number,
  deliveryFee: number,
  total: number
): string => {
  const dateStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateFull = new Date().toLocaleDateString('pt-BR');

  let text = `🍔 *NOVO PEDIDO - ${establishment.name.toUpperCase()}*\n`;
  text += `📅 *Data:* ${dateFull} às ${dateStr}\n`;
  text += `────────────────────────────\n\n`;

  text += `👤 *DADOS DO CLIENTE*\n`;
  text += `• *Nome:* ${form.customerName.trim() || 'Cliente'}\n`;
  if (form.customerPhone.trim()) {
    text += `• *Telefone/WhatsApp:* ${form.customerPhone.trim()}\n`;
  }

  text += `\n📍 *TIPO DE ATENDIMENTO:* `;
  if (form.deliveryType === 'delivery') {
    text += `🛵 *DELIVERY (Entrega)*\n`;
    text += `• *Endereço:* ${form.street.trim()}, Nº ${form.number.trim() || 'S/N'}\n`;
    if (form.neighborhood.trim()) text += `• *Bairro:* ${form.neighborhood.trim()}\n`;
    if (form.complement.trim()) text += `• *Complemento:* ${form.complement.trim()}\n`;
    if (form.reference.trim()) text += `• *Ponto de Ref.:* ${form.reference.trim()}\n`;
    text += `• *Cidade:* ${establishment.city} - ${establishment.state}\n`;
  } else if (form.deliveryType === 'retirada') {
    text += `🏪 *RETIRADA NO BALCÃO*\n`;
    text += `• *Endereço da Loja:* ${establishment.address}\n`;
  } else {
    text += `🍽️ *CONSUMO NO LOCAL / MESA*\n`;
    text += `• *Mesa:* ${form.tableNumber.trim() || 'Balcão / Atendimento Local'}\n`;
  }

  text += `\n📋 *ITENS DO PEDIDO:*\n`;
  items.forEach((item, index) => {
    const itemTotal = calculateItemTotal(item.product?.price || 0, item.selectedExtras, item.quantity);
    const unitPrice = calculateItemUnitPrice(item.product?.price || 0, item.selectedExtras);

    text += `\n*${index + 1}. ${item.quantity}x ${item.product.name}* - ${formatCurrency(itemTotal)}\n`;
    if (item.selectedExtras && item.selectedExtras.length > 0) {
      const extrasStr = item.selectedExtras.map((e) => `+ ${e.name} (${formatCurrency(e.price)})`).join(', ');
      text += `   ↳ *Adicionais:* ${extrasStr}\n`;
    }
    if (item.notes && item.notes.trim()) {
      text += `   ↳ *Obs do Item:* "${item.notes.trim()}"\n`;
    }
  });

  text += `\n────────────────────────────\n`;
  text += `💰 *RESUMO DE VALORES:*\n`;
  text += `• *Subtotal:* ${formatCurrency(subtotal)}\n`;
  if (form.deliveryType === 'delivery') {
    text += `• *Taxa de Entrega:* ${deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}\n`;
  }
  text += `• *TOTAL DO PEDIDO:* *${formatCurrency(total)}*\n`;

  text += `\n💳 *FORMA DE PAGAMENTO:*\n`;
  if (form.paymentMethod === 'pix') {
    text += `• *PIX:* ${establishment.pixKey} (${establishment.pixKeyType})\n`;
    if (establishment.pixBeneficiary) {
      text += `• *Favorecido:* ${establishment.pixBeneficiary}\n`;
    }
  } else if (form.paymentMethod === 'cartao_credito') {
    text += `• *Cartão de Crédito* (Levar maquininha na entrega/balcão)\n`;
  } else if (form.paymentMethod === 'cartao_debito') {
    text += `• *Cartão de Débito* (Levar maquininha na entrega/balcão)\n`;
  } else if (form.paymentMethod === 'dinheiro') {
    text += `• *Dinheiro*`;
    if (form.needsChange && form.changeFor.trim()) {
      text += ` (Troco para ${form.changeFor.trim()})\n`;
    } else {
      text += ` (Não precisa de troco / Valor exato)\n`;
    }
  }

  if (form.generalNotes && form.generalNotes.trim()) {
    text += `\n📝 *Observações Gerais do Pedido:*\n"${form.generalNotes.trim()}"\n`;
  }

  text += `\n────────────────────────────\n`;
  text += `_Pedido gerado via Cardápio Digital Interativo • ${establishment.name}_`;

  return text;
};
