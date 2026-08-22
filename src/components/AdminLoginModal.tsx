import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, X, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { EstablishmentInfo } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (rememberMe: boolean) => void;
  establishment: EstablishmentInfo;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  establishment,
}) => {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  if (!isOpen) return null;

  const expectedPin = establishment.adminPin || '1234';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Por favor, digite o PIN ou senha de administrador.');
      return;
    }

    if (pin.trim() === expectedPin.trim()) {
      setError(null);
      onSuccess(rememberMe);
    } else {
      setError('PIN ou senha incorreta. Tente novamente.');
    }
  };

  return (
    <div
      id="admin-login-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="admin-login-card"
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Decoration */}
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 p-6 border-b border-zinc-800 text-center relative">
          <button
            id="btn-close-admin-login"
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Voltar ao cardápio"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 font-black mx-auto mb-3 shadow-lg shadow-amber-500/30">
            <Lock className="w-7 h-7 stroke-[2.5]" />
          </div>

          <h3 className="font-display font-black text-lg sm:text-xl text-white">
            Painel do Estabelecimento
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Acesso restrito para o proprietário gerenciar produtos, preços, pedidos e dados da loja.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span>Senha / PIN de Administrador:</span>
              <span className="text-[10px] text-amber-400/80 font-normal">Padrão inicial: 1234</span>
            </label>

            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
              <input
                id="input-admin-pin"
                type={showPassword ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Digite seu PIN ou senha..."
                autoFocus
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                id="btn-toggle-password-view"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              id="admin-login-error"
              className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-shake"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <span>Manter conectado neste dispositivo</span>
            </label>
          </div>

          <div className="pt-2 space-y-2">
            <button
              id="btn-submit-admin-login"
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black py-3 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer border border-amber-300/40"
            >
              <span>Entrar no Painel Administrativo</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              id="btn-cancel-admin-login"
              type="button"
              onClick={onClose}
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white font-semibold py-2.5 px-4 rounded-2xl text-xs transition-colors cursor-pointer border border-zinc-800"
            >
              Voltar para o Cardápio (Área do Cliente)
            </button>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 text-center">
            <p className="text-[11px] text-zinc-500">
              Clientes que acessam o link principal visualizam diretamente o cardápio sem necessidade de login.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
