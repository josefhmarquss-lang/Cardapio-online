import React, { useState } from 'react';
import { 
  Flame, 
  MapPin, 
  Clock, 
  Phone, 
  Instagram, 
  SlidersHorizontal, 
  Search, 
  X, 
  ShoppingBag, 
  Sparkles,
  ExternalLink,
  Bike,
  Store,
  Compass,
  CheckCircle2,
  ShieldAlert,
  Moon
} from 'lucide-react';
import { EstablishmentInfo } from '../types';
import { formatCurrency, getEstablishmentStatus, getThemeConfig } from '../utils';

interface HeaderProps {
  establishment: EstablishmentInfo;
  cartCount: number;
  onOpenCart: () => void;
  isAdminLoggedIn?: boolean;
  onOpenAdmin?: () => void;
  onLogoutAdmin?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onScrollToMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  establishment,
  cartCount,
  onOpenCart,
  isAdminLoggedIn,
  onOpenAdmin,
  onLogoutAdmin,
  searchQuery,
  onSearchChange,
  onScrollToMenu,
}) => {
  const status = getEstablishmentStatus(establishment);
  const theme = getThemeConfig(establishment.visualTheme);

  const cleanInstagram = establishment.instagram.replace('@', '').trim();
  const cleanWhatsapp = establishment.whatsapp.replace(/\D/g, '');

  return (
    <header id="header-root" className="w-full relative">
      {/* Top Banner: Only shows Admin bar if owner is authenticated, otherwise shows clean customer announcement */}
      {isAdminLoggedIn ? (
        <div 
          id="admin-indicator-bar" 
          className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-zinc-950 px-3.5 py-1.5 text-xs font-semibold shadow-md flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-zinc-950 fill-zinc-950" />
            <span className="truncate text-[11px] sm:text-xs">
              <strong>SESSÃO DO ADMINISTRADOR ATIVA</strong>
              <span className="hidden sm:inline"> • {establishment.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenAdmin && (
              <button
                id="btn-open-admin-top"
                onClick={onOpenAdmin}
                className="bg-zinc-950 hover:bg-zinc-900 text-amber-400 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow border border-amber-400/30"
                title="Abrir Painel do Estabelecimento"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Abrir Painel</span>
              </button>
            )}
            {onLogoutAdmin && (
              <button
                id="btn-logout-admin-top"
                onClick={onLogoutAdmin}
                className="bg-zinc-950/60 hover:bg-zinc-950 text-zinc-300 hover:text-rose-400 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer"
                title="Sair do modo administrador"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      ) : (
        <div 
          id="customer-welcome-bar" 
          className="bg-zinc-950/90 border-b border-zinc-800/80 text-zinc-400 px-3 sm:px-4 py-1.5 text-[11px] flex items-center justify-between"
        >
          <div className="flex items-center gap-1.5 max-w-full truncate">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">
              Cardápio Digital Oficial • {establishment.name} • {establishment.city} - {establishment.state}
            </span>
          </div>
          {establishment.freeDeliveryAbove && establishment.freeDeliveryAbove > 0 && (
            <span className="text-emerald-400 font-bold hidden sm:inline shrink-0">
              🛵 Entrega Grátis acima de {formatCurrency(establishment.freeDeliveryAbove)}
            </span>
          )}
        </div>
      )}

      {/* Main Top Nav */}
      <div 
        id="main-nav" 
        className="bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800/90 sticky top-0 z-40 px-3 sm:px-4 py-2.5 sm:py-3 transition-colors"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Establishment Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {establishment.logoUrl ? (
              <img
                src={establishment.logoUrl}
                alt={establishment.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover ring-2 ring-amber-400/30 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-zinc-950 text-base sm:text-lg shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30 shrink-0">
                2I
              </div>
            )}
            
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-sm sm:text-base text-zinc-100 leading-tight truncate">
                {establishment.name}
              </h1>
              <p className="text-[11px] sm:text-xs text-amber-400/90 font-medium truncate">
                {establishment.subtitle}
              </p>
            </div>
          </div>

          {/* Action Links & Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Instagram */}
            {cleanInstagram && (
              <a
                id="nav-instagram-link"
                href={`https://instagram.com/${cleanInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-pink-400 flex items-center justify-center transition-colors border border-zinc-700/50"
                title={`Instagram: @${cleanInstagram}`}
              >
                <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
            )}

            {/* Quick WhatsApp direct chat */}
            {cleanWhatsapp && (
              <a
                id="nav-whatsapp-link"
                href={`https://wa.me/${cleanWhatsapp}?text=Ol%C3%A1%21+Gostaria+de+fazer+um+pedido+no+card%C3%A1pio+da+${encodeURIComponent(establishment.name)}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-800 hover:bg-emerald-950/60 text-zinc-300 hover:text-emerald-400 flex items-center justify-center transition-colors border border-zinc-700/50"
                title="Falar no WhatsApp"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
            )}

            {/* Cart Button */}
            <button
              id="nav-cart-btn"
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold px-3 sm:px-3.5 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden xs:inline">Sacola</span>
              {cartCount > 0 && (
                <span className="bg-zinc-950 text-amber-400 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center -mr-1">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Establishment Info Card Header (Compact, No Empty White Space) */}
      <div id="establishment-info-banner" className="bg-zinc-900/60 border-b border-zinc-800/80 px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Status, Location and Delivery Row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            {/* Real-time Open/Closed Badge */}
            <span 
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold ${
                status.isOpen 
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' 
                  : status.badgeColor === 'rose'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {status.statusText}
            </span>

            {/* City / Location */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {establishment.city} - {establishment.state}
            </span>

            {/* Delivery Estimate */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
              <Bike className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              Entrega ({establishment.deliveryEstimate})
            </span>

            {/* Delivery Fee Info */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
              Taxa: {establishment.deliveryFee > 0 ? formatCurrency(establishment.deliveryFee) : 'Grátis'}
              {establishment.freeDeliveryAbove && establishment.freeDeliveryAbove > 0 && (
                <span className="text-emerald-400 font-bold ml-0.5">
                  (Grátis acima de {formatCurrency(establishment.freeDeliveryAbove)})
                </span>
              )}
            </span>
          </div>

          {/* Address & Working Hours Detail Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400 bg-zinc-950/70 p-2.5 sm:p-3 rounded-xl border border-zinc-800/70">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{establishment.openingHoursText}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="truncate">{establishment.address}</span>
              </div>
              {establishment.mapsUrl && (
                <a
                  id="btn-google-maps-link"
                  href={establishment.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-amber-400 hover:text-amber-300 text-[11px] font-bold flex items-center gap-0.5 bg-zinc-900 hover:bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-800 transition-colors"
                >
                  <span>Como Chegar</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative pt-1">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
              <input
                id="search-input-header"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar lanches, hambúrgueres, lasanhas, combos, bebidas..."
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  id="btn-clear-search"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
