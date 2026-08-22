import React from 'react';
import { 
  Instagram, 
  Phone, 
  MapPin, 
  Clock, 
  ShoppingBag, 
  Sparkles, 
  SlidersHorizontal,
  ChevronUp,
  ExternalLink,
  QrCode,
  Lock
} from 'lucide-react';
import { EstablishmentInfo } from '../types';
import { getThemeConfig } from '../utils';

interface FooterProps {
  establishment: EstablishmentInfo;
  onOpenCart: () => void;
  onOpenAdminAuth: () => void;
  isAdminLoggedIn?: boolean;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  establishment,
  onOpenCart,
  onOpenAdminAuth,
  isAdminLoggedIn,
  onOpenAdmin,
}) => {
  const theme = getThemeConfig(establishment.visualTheme);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cleanInstagram = establishment.instagram.replace('@', '').trim();
  const cleanWhatsapp = establishment.whatsapp.replace(/\D/g, '');

  return (
    <footer id="footer-root" className="bg-zinc-950 border-t border-zinc-800 text-zinc-300 pt-8 pb-24 sm:pb-12 px-4 mt-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 ${theme.glow} blur-3xl pointer-events-none rounded-full`} />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Brand identity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-3">
            {establishment.logoUrl ? (
              <img
                src={establishment.logoUrl}
                alt={establishment.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-zinc-950 text-xl shadow-lg shadow-amber-500/20">
                2I
              </div>
            )}
            <div>
              <h3 className="font-display font-black text-lg sm:text-xl text-white">
                {establishment.name}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-amber-400">
                "{establishment.subtitle}"
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {establishment.city} - {establishment.state}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              id="footer-btn-pedir"
              onClick={onOpenCart}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>VER SACOLA</span>
            </button>

            <button
              id="footer-btn-scroll-top"
              onClick={scrollToTop}
              className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer"
              title="Voltar ao topo"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Grid (Configurable details) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Address & Maps */}
          <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/60 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-orange-400 font-bold mb-1">
                <MapPin className="w-4 h-4" />
                <span>Localização</span>
              </div>
              <p className="text-zinc-300 font-medium text-[11px] leading-relaxed">{establishment.address}</p>
              <p className="text-zinc-500 text-[11px]">{establishment.city} - {establishment.state}</p>
            </div>
            {establishment.mapsUrl && (
              <a
                id="footer-maps-link"
                href={establishment.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline text-[11px] font-bold inline-flex items-center gap-1 pt-1"
              >
                <span>Ver no Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Opening Hours */}
          <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
              <Clock className="w-4 h-4" />
              <span>Horário de Funcionamento</span>
            </div>
            <p className="text-zinc-300 font-medium text-[11px] leading-relaxed">{establishment.openingHoursText}</p>
            <p className="text-emerald-400 font-semibold text-[11px]">Delivery & Balcão</p>
          </div>

          {/* Social / Instagram */}
          <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-pink-400 font-bold mb-1">
              <Instagram className="w-4 h-4" />
              <span>Instagram Oficial</span>
            </div>
            {cleanInstagram ? (
              <a
                id="footer-instagram-link"
                href={`https://instagram.com/${cleanInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-200 hover:text-pink-400 font-medium block truncate transition-colors underline text-[11px]"
              >
                @{cleanInstagram}
              </a>
            ) : (
              <span className="text-zinc-500 text-[11px]">Não informado</span>
            )}
            <p className="text-zinc-500 text-[10px]">Siga para promoções</p>
          </div>

          {/* WhatsApp */}
          <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
              <Phone className="w-4 h-4" />
              <span>WhatsApp de Pedidos</span>
            </div>
            <p className="text-zinc-200 font-mono font-medium text-[11px]">{establishment.phone}</p>
            {cleanWhatsapp && (
              <a
                id="footer-whatsapp-link"
                href={`https://wa.me/${cleanWhatsapp}?text=Ol%C3%A1%2C+estou+acessando+o+card%C3%A1pio+da+${encodeURIComponent(establishment.name)}!`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline font-semibold text-[11px] block"
              >
                Enviar mensagem direta →
              </a>
            )}
          </div>
        </div>

        {/* Presentation & Admin Access Footer Strip */}
        <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Cardápio Digital Oficial • {establishment.name} • {establishment.city} - {establishment.state}
            </span>
          </div>

          {isAdminLoggedIn && onOpenAdmin ? (
            <button
              id="footer-btn-config"
              onClick={onOpenAdmin}
              className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer bg-zinc-900/80 hover:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Painel do Estabelecimento</span>
            </button>
          ) : (
            <button
              id="footer-btn-admin-login"
              onClick={onOpenAdminAuth}
              className="text-zinc-600 hover:text-zinc-400 font-medium flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-zinc-900"
              title="Acesso exclusivo para o proprietário"
            >
              <Lock className="w-3 h-3" />
              <span>Área do Lojista</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
