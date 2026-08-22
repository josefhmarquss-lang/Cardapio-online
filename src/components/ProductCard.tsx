import React from 'react';
import { Plus, Flame, Sparkles, Clock, Ban, Utensils } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils';

interface ProductCardProps {
  product: Product;
  onOpenProductModal: (product: Product) => void;
  onQuickAdd: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenProductModal,
  onQuickAdd,
}) => {
  const isAvailable = product.available !== false;
  const hasExtras = product.extras && product.extras.length > 0;

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => isAvailable && onOpenProductModal(product)}
      className={`group bg-zinc-900/80 hover:bg-zinc-900 border rounded-2xl p-3 sm:p-4 transition-all duration-200 flex flex-col justify-between relative ${
        isAvailable 
          ? 'border-zinc-800/80 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 cursor-pointer' 
          : 'border-zinc-800/40 opacity-75 cursor-not-allowed'
      }`}
    >
      {/* Top Image Section */}
      <div className="relative w-full h-40 sm:h-44 rounded-xl overflow-hidden bg-zinc-950 mb-3 shrink-0 flex items-center justify-center">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isAvailable ? 'group-hover:scale-105' : 'grayscale contrast-75'
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-600 p-4 text-center">
            <Utensils className="w-8 h-8 mb-1 text-amber-500/50" />
            <span className="text-[11px] font-medium text-zinc-500">Foto em atualização</span>
          </div>
        )}

        {/* Badges Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {!isAvailable ? (
            <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow flex items-center gap-1">
              <Ban className="w-3 h-3" /> Esgotado
            </span>
          ) : (
            <>
              {product.badge && (
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow">
                  {product.badge}
                </span>
              )}
              {product.isHighlight && !product.badge && (
                <span className="bg-orange-500 text-zinc-950 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow flex items-center gap-0.5">
                  <Flame className="w-3 h-3 fill-zinc-950" /> Destaque
                </span>
              )}
            </>
          )}
        </div>

        {/* Serving Size Info / Prep Time */}
        {(product.servingSize || product.preparationTime) && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 z-10">
            {product.servingSize && (
              <span className="bg-zinc-950/85 backdrop-blur-sm text-zinc-300 text-[10px] font-medium px-2 py-0.5 rounded-md border border-zinc-800">
                {product.servingSize}
              </span>
            )}
          </div>
        )}

        {/* Tap to view hover prompt (desktop) */}
        {isAvailable && (
          <div className="absolute inset-0 bg-zinc-950/30 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center pointer-events-none">
            <span className="bg-zinc-950/90 backdrop-blur-md text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30 shadow-xl">
              Ver detalhes & adicionais
            </span>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-display font-bold text-sm sm:text-base text-zinc-100 group-hover:text-amber-400 transition-colors leading-snug">
            {product.name}
          </h4>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Quick Action */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
              Preço
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-base sm:text-lg font-black text-amber-400">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-zinc-500 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          {isAvailable ? (
            <button
              id={`btn-add-product-${product.id}`}
              onClick={(e) => onQuickAdd(product, e)}
              className="min-h-[38px] bg-zinc-800 hover:bg-amber-500 text-zinc-200 hover:text-zinc-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all border border-zinc-700/60 hover:border-amber-500 shadow-sm active:scale-95 cursor-pointer shrink-0"
              title={hasExtras ? 'Personalizar adicionais' : 'Adicionar ao pedido'}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{hasExtras ? 'Personalizar' : 'Adicionar'}</span>
            </button>
          ) : (
            <span className="text-[11px] font-bold text-zinc-500 bg-zinc-800/60 px-2.5 py-1 rounded-lg">
              Indisponível
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
