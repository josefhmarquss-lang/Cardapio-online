import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, Sparkles, MessageSquare, Info, Utensils, Clock } from 'lucide-react';
import { Product, ProductExtra, CartItemExtra } from '../types';
import { formatCurrency, calculateExtrasTotal, calculateItemUnitPrice, calculateItemTotal } from '../utils';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedExtras: CartItemExtra[], notes: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<CartItemExtra[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedExtras([]);
      setNotes('');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const toggleExtra = (extra: ProductExtra) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      if (exists) {
        return prev.filter((e) => e.id !== extra.id);
      } else {
        return [...prev, { id: extra.id, name: extra.name, price: extra.price }];
      }
    });
  };

  const extrasTotal = calculateExtrasTotal(selectedExtras);
  const unitPrice = calculateItemUnitPrice(product.price, selectedExtras);
  const totalPrice = calculateItemTotal(product.price, selectedExtras, quantity);

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedExtras, notes);
    onClose();
  };

  return (
    <div
      id="product-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="product-modal-content"
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Image Section */}
        <div className="relative h-52 sm:h-60 w-full bg-zinc-950 shrink-0">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-600 p-4">
              <Utensils className="w-12 h-12 mb-2 text-amber-500/40" />
              <span className="text-xs font-semibold text-zinc-500">Foto demonstrativa do item</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/60" />

          {/* Close button */}
          <button
            id="btn-close-product-modal"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors border border-zinc-700/50 cursor-pointer shadow-lg z-10"
            title="Fechar detalhes"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category Tag & Badges */}
          <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5 z-10">
            <span className="bg-zinc-950/85 backdrop-blur-md text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30">
              {product.categoryName}
            </span>
            {product.badge && (
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 text-xs font-black px-2.5 py-1 rounded-full shadow">
                {product.badge}
              </span>
            )}
          </div>

          {/* Neutral Photo Notice */}
          <div className="absolute bottom-2.5 right-3 bg-zinc-950/90 text-zinc-400 text-[10px] px-2.5 py-0.5 rounded-full border border-zinc-800 flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-400" />
            <span>Foto ilustrativa (substituível pelo proprietário)</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Title & Price */}
          <div className="border-b border-zinc-800/80 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-black text-white leading-tight">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {product.servingSize && (
                    <span className="text-xs text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md">
                      {product.servingSize}
                    </span>
                  )}
                  {product.preparationTime && (
                    <span className="text-xs text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {product.preparationTime}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-display text-xl sm:text-2xl font-black text-amber-400">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="block text-xs text-zinc-500 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 mt-2.5 leading-relaxed font-normal">
              {product.description}
            </p>
          </div>

          {/* Extras / Adicionais Section */}
          {product.extras && product.extras.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Adicionais & Turbinadas</span>
                  <span className="text-[11px] font-normal text-zinc-400 normal-case">(Opcional)</span>
                </h4>
                {selectedExtras.length > 0 && (
                  <span className="text-xs text-amber-400 font-semibold">
                    +{formatCurrency(extrasTotal)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                {product.extras.map((extra) => {
                  const isSelected = selectedExtras.some((e) => e.id === extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 text-white'
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-amber-500 text-zinc-950'
                              : 'border border-zinc-700 bg-zinc-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{extra.name}</span>
                      </div>

                      <span className="text-xs sm:text-sm font-bold text-amber-400">
                        +{formatCurrency(extra.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observations / Notes */}
          {product.allowsNotes !== false && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Alguma observação para este item?</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: sem cebola, hambúrguer bem passado, maionese à parte, caprichar no milho..."
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* Sticky Modal Footer: Quantity & Add Button */}
        <div className="p-3.5 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          {/* Quantity Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 shrink-0">
            <button
              id="btn-modal-qty-minus"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Diminuir quantidade"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-9 text-center font-display font-black text-sm text-white">
              {quantity}
            </span>
            <button
              id="btn-modal-qty-plus"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Aumentar quantidade"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Submit */}
          <button
            id="btn-modal-confirm-add"
            onClick={handleAdd}
            className="flex-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer border border-amber-300/40"
          >
            <span>Adicionar ao Pedido</span>
            <span className="font-display text-sm sm:text-base font-black">
              {formatCurrency(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
