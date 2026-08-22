import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Send, 
  MapPin, 
  CreditCard, 
  Bike, 
  Store, 
  Utensils, 
  CheckCircle2, 
  Copy, 
  AlertCircle,
  QrCode,
  Sparkles,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, DeliveryType, EstablishmentInfo, OrderFormState, PaymentMethod, RegisteredOrder } from '../types';
import { 
  formatCurrency, 
  generateWhatsAppMessage, 
  calculateCartSubtotal, 
  calculateOrderTotal, 
  calculateItemTotal, 
  calculateItemUnitPrice,
  calculateExtrasTotal 
} from '../utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  establishment: EstablishmentInfo;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onOrderCompleted?: (order: RegisteredOrder) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  establishment,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
}) => {
  const [copiedPix, setCopiedPix] = useState(false);
  const [form, setForm] = useState<OrderFormState>({
    customerName: '',
    customerPhone: '',
    deliveryType: 'delivery',
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
    reference: '',
    tableNumber: '',
    paymentMethod: 'pix',
    needsChange: false,
    changeFor: '',
    generalNotes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const subtotal = calculateCartSubtotal(items);

  // Delivery fee calculation with free delivery threshold
  const isFreeDelivery = 
    form.deliveryType === 'delivery' &&
    establishment.freeDeliveryAbove &&
    establishment.freeDeliveryAbove > 0 &&
    subtotal >= establishment.freeDeliveryAbove;

  const deliveryFee = form.deliveryType === 'delivery' ? (isFreeDelivery ? 0 : establishment.deliveryFee) : 0;
  const total = calculateOrderTotal(subtotal, deliveryFee);

  const freeDeliveryRemaining = 
    establishment.freeDeliveryAbove && establishment.freeDeliveryAbove > 0 && subtotal < establishment.freeDeliveryAbove
      ? establishment.freeDeliveryAbove - subtotal
      : 0;

  const handleCopyPix = () => {
    if (establishment.pixKey) {
      navigator.clipboard.writeText(establishment.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.customerName.trim()) {
      errors.customerName = 'Por favor, informe seu nome';
    }

    if (form.deliveryType === 'delivery') {
      if (!form.street.trim()) {
        errors.street = 'Informe o nome da rua ou avenida';
      }
      if (!form.neighborhood.trim()) {
        errors.neighborhood = 'Informe o bairro';
      }
    }

    if (form.deliveryType === 'mesa' && !form.tableNumber.trim()) {
      errors.tableNumber = 'Informe o número da sua mesa';
    }

    if (establishment.minimumOrder > 0 && subtotal < establishment.minimumOrder) {
      errors.minimumOrder = `O pedido mínimo é de ${formatCurrency(establishment.minimumOrder)}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendWhatsAppOrder = () => {
    if (!validateForm()) {
      return;
    }

    // Launch celebration confetti
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    const message = generateWhatsAppMessage(
      items,
      form,
      establishment,
      subtotal,
      deliveryFee,
      total
    );

    // Save registered order for owner history
    if (onOrderCompleted) {
      const summary = items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ');
      const newOrder: RegisteredOrder = {
        id: `PED-${Date.now().toString().slice(-5)}`,
        createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        deliveryType: form.deliveryType,
        itemsSummary: summary,
        total,
        paymentMethod: form.paymentMethod,
        status: 'recebido',
      };
      onOrderCompleted(newOrder);
    }

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = establishment.whatsapp.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div
      id="cart-drawer-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        id="cart-drawer-panel"
        className="bg-zinc-900 border-l border-zinc-800 w-full max-w-lg h-full overflow-y-auto flex flex-col shadow-2xl animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-base sm:text-lg text-white">
                Sua Sacola de Pedidos
              </h3>
              <p className="text-xs text-zinc-400">
                {items.length === 0 ? 'Nenhum item' : `${items.length} ${items.length === 1 ? 'tipo de item' : 'tipos de itens'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {items.length > 0 && (
              <button
                id="btn-clear-cart"
                onClick={onClearCart}
                className="text-zinc-500 hover:text-rose-400 p-2 rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer"
                title="Limpar toda a sacola"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              id="btn-close-cart"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Fechar sacola"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free Delivery Progress Banner */}
        {items.length > 0 && establishment.freeDeliveryAbove && establishment.freeDeliveryAbove > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs">
            {isFreeDelivery ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Parabéns! Você ganhou <strong>ENTREGA GRÁTIS</strong>!
              </span>
            ) : (
              <div className="flex items-center justify-between text-zinc-300">
                <span>Faltam <strong>{formatCurrency(freeDeliveryRemaining)}</strong> para entrega grátis!</span>
                <span className="text-amber-400 font-bold">{formatCurrency(subtotal)} / {formatCurrency(establishment.freeDeliveryAbove)}</span>
              </div>
            )}
          </div>
        )}

        {/* Drawer Body Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-6">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-display font-bold text-lg text-white">
                Sua sacola está vazia
              </h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Adicione deliciosos lanches, combos, lasanhas ou bebidas do cardápio para começar.
              </p>
              <button
                id="btn-empty-cart-back"
                onClick={onClose}
                className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-bold text-xs px-5 py-2.5 rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer shadow-md"
              >
                Ver Cardápio
              </button>
            </div>
          ) : (
            <>
              {/* Itemized list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Itens Selecionados ({items.length})
                </h4>

                <div className="space-y-2.5">
                  {items.map((item) => {
                    const itemUnitPrice = calculateItemUnitPrice(item.product?.price || 0, item.selectedExtras);
                    const calculatedItemTotal = calculateItemTotal(item.product?.price || 0, item.selectedExtras, item.quantity);

                    return (
                      <div
                        key={item.cartItemId}
                        className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3 flex flex-col gap-2 relative"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h5 className="font-display font-bold text-sm text-white leading-tight">
                              {item.product.name}
                            </h5>
                            <span className="text-xs font-semibold text-amber-400">
                              {formatCurrency(itemUnitPrice)} un.
                            </span>
                          </div>

                          <span className="font-display font-black text-sm text-white shrink-0">
                            {formatCurrency(calculatedItemTotal)}
                          </span>
                        </div>

                      {/* Selected Extras */}
                      {item.selectedExtras && item.selectedExtras.length > 0 && (
                        <div className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50 space-y-0.5">
                          <span className="font-semibold text-zinc-300 block">Adicionais:</span>
                          {item.selectedExtras.map((extra) => (
                            <div key={extra.id} className="flex justify-between">
                              <span>+ {extra.name}</span>
                              <span className="text-amber-400/90">{formatCurrency(extra.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Item Notes */}
                      {item.notes && (
                        <div className="text-[11px] text-zinc-400 italic bg-zinc-900/40 px-2 py-1 rounded border border-zinc-800/40">
                          "{item.notes}"
                        </div>
                      )}

                      {/* Quantity row & Remove */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 mt-1">
                        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                            className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                            className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.cartItemId)}
                          className="text-zinc-500 hover:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {/* Service Delivery Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Como deseja receber seu pedido?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, deliveryType: 'delivery' })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      form.deliveryType === 'delivery'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md font-bold'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Bike className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    <span className="text-xs block">Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, deliveryType: 'retirada' })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      form.deliveryType === 'retirada'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md font-bold'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Store className="w-4 h-4 mx-auto mb-1 text-orange-400" />
                    <span className="text-xs block">Retirar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, deliveryType: 'mesa' })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      form.deliveryType === 'mesa'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md font-bold'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Utensils className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
                    <span className="text-xs block">Na Mesa</span>
                  </button>
                </div>
              </div>

              {/* Customer Info Form */}
              <div className="space-y-3 bg-zinc-950/70 p-3.5 sm:p-4 rounded-2xl border border-zinc-800/80">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dados para Entrega / Identificação</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">
                      Seu Nome *
                    </label>
                    <input
                      id="input-customer-name"
                      type="text"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      placeholder="Ex: Carlos Silva"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                    />
                    {formErrors.customerName && (
                      <span className="text-[11px] text-rose-400 mt-0.5 block">
                        {formErrors.customerName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">
                      WhatsApp / Telefone
                    </label>
                    <input
                      id="input-customer-phone"
                      type="tel"
                      value={form.customerPhone}
                      onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                      placeholder="(82) 99999-9999"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none"
                    />
                  </div>
                </div>

                {/* Conditional Fields based on Delivery Type */}
                {form.deliveryType === 'delivery' && (
                  <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-zinc-400 block mb-1">
                          Rua / Avenida *
                        </label>
                        <input
                          id="input-customer-street"
                          type="text"
                          value={form.street}
                          onChange={(e) => setForm({ ...form, street: e.target.value })}
                          placeholder="Ex: Rua São Francisco"
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                        {formErrors.street && (
                          <span className="text-[11px] text-rose-400 mt-0.5 block">
                            {formErrors.street}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-400 block mb-1">
                          Número
                        </label>
                        <input
                          id="input-customer-number"
                          type="text"
                          value={form.number}
                          onChange={(e) => setForm({ ...form, number: e.target.value })}
                          placeholder="123"
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-zinc-400 block mb-1">
                          Bairro *
                        </label>
                        <input
                          id="input-customer-neighborhood"
                          type="text"
                          value={form.neighborhood}
                          onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                          placeholder="Ex: Centro, Brasília, Primavera..."
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                        {formErrors.neighborhood && (
                          <span className="text-[11px] text-rose-400 mt-0.5 block">
                            {formErrors.neighborhood}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-400 block mb-1">
                          Complemento / Ap.
                        </label>
                        <input
                          id="input-customer-complement"
                          type="text"
                          value={form.complement}
                          onChange={(e) => setForm({ ...form, complement: e.target.value })}
                          placeholder="Apto 201, Bloco B..."
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-400 block mb-1">
                        Ponto de Referência
                      </label>
                      <input
                        id="input-customer-reference"
                        type="text"
                        value={form.reference}
                        onChange={(e) => setForm({ ...form, reference: e.target.value })}
                        placeholder="Ex: Próximo à praça, em frente à farmácia..."
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {form.deliveryType === 'retirada' && (
                  <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1">
                    <span className="font-bold text-amber-400 block">Endereço de Retirada:</span>
                    <p>{establishment.name} - {establishment.address}</p>
                    <p className="text-zinc-500 text-[11px]">Tempo estimado de preparo: {establishment.pickupEstimate}</p>
                  </div>
                )}

                {form.deliveryType === 'mesa' && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">
                      Número da Mesa / Identificação *
                    </label>
                    <input
                      id="input-table-number"
                      type="text"
                      value={form.tableNumber}
                      onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                      placeholder="Ex: Mesa 04 ou Balcão"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                    {formErrors.tableNumber && (
                      <span className="text-[11px] text-rose-400 mt-0.5 block">
                        {formErrors.tableNumber}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3 bg-zinc-950/70 p-3.5 sm:p-4 rounded-2xl border border-zinc-800/80">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Forma de Pagamento</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: 'pix' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      form.paymentMethod === 'pix'
                        ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs">PIX Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: 'cartao_credito' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      form.paymentMethod === 'cartao_credito'
                        ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs">Cartão Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: 'cartao_debito' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      form.paymentMethod === 'cartao_debito'
                        ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-xs">Cartão Débito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: 'dinheiro' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      form.paymentMethod === 'dinheiro'
                        ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="text-xs">💵 Dinheiro</span>
                  </button>
                </div>

                {/* Pix Details Box */}
                {form.paymentMethod === 'pix' && (
                  <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="font-semibold text-emerald-400">Chave PIX da Loja:</span>
                      <span className="text-[10px] text-zinc-500">{establishment.pixKeyType}</span>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                      <span className="font-mono text-zinc-200 truncate text-[11px]">
                        {establishment.pixKey}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="ml-2 px-2 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        {copiedPix ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>

                    {establishment.pixBeneficiary && (
                      <p className="text-[11px] text-zinc-400">
                        Beneficiário: <strong className="text-zinc-200">{establishment.pixBeneficiary}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Cash Change Details */}
                {form.paymentMethod === 'dinheiro' && (
                  <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-2 text-xs">
                    <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.needsChange}
                        onChange={(e) => setForm({ ...form, needsChange: e.target.checked })}
                        className="rounded accent-amber-500 w-4 h-4"
                      />
                      <span>Precisa de troco?</span>
                    </label>

                    {form.needsChange && (
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">
                          Troco para quanto em dinheiro?
                        </label>
                        <input
                          type="text"
                          value={form.changeFor}
                          onChange={(e) => setForm({ ...form, changeFor: e.target.value })}
                          placeholder="Ex: R$ 50,00 ou R$ 100,00"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* General Order Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400 block">
                  Observações Gerais do Pedido (Opcional):
                </label>
                <textarea
                  value={form.generalNotes}
                  onChange={(e) => setForm({ ...form, generalNotes: e.target.value })}
                  placeholder="Ex: Tocar a campainha, entregar na portaria, caprichar nos guardanapos..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white placeholder-zinc-600 outline-none resize-none"
                />
              </div>

              {/* Order Values Summary */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal dos itens:</span>
                  <span className="font-semibold text-zinc-200">{formatCurrency(subtotal)}</span>
                </div>

                {form.deliveryType === 'delivery' && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Taxa de Entrega:</span>
                    <span className="font-semibold text-zinc-200">
                      {isFreeDelivery ? (
                        <span className="text-emerald-400 font-bold">Grátis</span>
                      ) : (
                        formatCurrency(deliveryFee)
                      )}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline">
                  <span className="text-sm font-black text-white">TOTAL A PAGAR:</span>
                  <span className="font-display text-xl sm:text-2xl font-black text-amber-400">
                    {formatCurrency(total)}
                  </span>
                </div>

                {/* Minimum Order Alert */}
                {establishment.minimumOrder > 0 && subtotal < establishment.minimumOrder && (
                  <div className="mt-2 p-2 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Pedido mínimo na loja é {formatCurrency(establishment.minimumOrder)}. Faltam {formatCurrency(establishment.minimumOrder - subtotal)}.</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sticky Drawer Footer */}
        {items.length > 0 && (
          <div className="p-3.5 sm:p-4 bg-zinc-950 border-t border-zinc-800 sticky bottom-0 z-20">
            <button
              id="btn-send-whatsapp-order"
              onClick={handleSendWhatsAppOrder}
              disabled={establishment.minimumOrder > 0 && subtotal < establishment.minimumOrder}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer border border-emerald-300/40"
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>Enviar Pedido no WhatsApp</span>
              </div>
              <span className="font-display text-sm sm:text-base font-black">
                {formatCurrency(total)}
              </span>
            </button>
            <p className="text-[10px] text-zinc-500 text-center mt-2">
              Seu pedido será gerado e enviado diretamente para o WhatsApp da {establishment.name}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
