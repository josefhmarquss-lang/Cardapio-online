import React from 'react';
import { Flame, Sparkles, Plus, Star } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils';

interface HighlightSectionProps {
  products: Product[];
  onOpenProductModal: (product: Product) => void;
  onQuickAdd: (product: Product, e: React.MouseEvent) => void;
}

export const HighlightSection: React.FC<HighlightSectionProps> = ({
  products,
  onOpenProductModal,
  onQuickAdd,
}) => {
  if (products.length === 0) return null;

  return (
    <section id="destaques-section" className="py-6 px-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Flame className="w-5 h-5 fill-amber-400 text-amber-400 animate-pulse" />
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight">
              Destaques Especiais
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Os campeões de pedidos e especialidades mais famosas da Dois Irmãos
          </p>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          Apresentação Premium
        </span>
      </div>

      {/* Featured Highlight Carousel / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            id={`highlight-card-${product.id}`}
            onClick={() => onOpenProductModal(product)}
            className="group relative bg-zinc-900/90 rounded-2xl overflow-hidden border border-zinc-800/80 hover:border-amber-500/50 shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
          >
            {/* Top Image Banner */}
            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-zinc-950">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  // Fallback graceful placeholder if network blocks image
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
                }}
              />
              
              {/* Dark Gradient Overlay for text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

              {/* Tag / Badge */}
              {product.badge && (
                <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black text-[11px] px-2.5 py-1 rounded-lg uppercase tracking-wide shadow-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-zinc-950 text-zinc-950" />
                  {product.badge}
                </span>
              )}

              {/* Category pill */}
              <span className="absolute top-3 right-3 bg-zinc-900/80 backdrop-blur-md text-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-zinc-700/50">
                {product.categoryName}
              </span>

              {/* Serving size badge */}
              {product.servingSize && (
                <span className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-md text-amber-300 text-[11px] font-medium px-2 py-0.5 rounded-md border border-amber-500/30">
                  {product.servingSize}
                </span>
              )}
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-lg font-black text-white group-hover:text-amber-400 transition-colors leading-tight">
                  {product.name}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Price & Action Button */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                    Preço
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-xl font-black text-amber-400">
                      {formatCurrency(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-zinc-500 line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  id={`btn-add-highlight-${product.id}`}
                  onClick={(e) => onQuickAdd(product, e)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-transform cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>ADICIONAR</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
