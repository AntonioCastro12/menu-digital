import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function CartFloatingButton({
  totalCount = 0,
  totalPrice = 0,
  currency = 'MXN',
  onClick
}) {
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (totalCount > 0) {
      setBump(true);
      const timer = setTimeout(() => setBump(false), 350);
      return () => clearTimeout(timer);
    }
  }, [totalCount]);

  if (totalCount <= 0) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center animate-fade-in-up">
      <button
        type="button"
        onClick={onClick}
        className={`pointer-events-auto w-full max-w-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-95 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between transition-all duration-300 border border-orange-400/40 transform hover:-translate-y-0.5 ${
          bump ? 'scale-105 shadow-orange-600/50' : 'scale-100 shadow-orange-950/25'
        }`}
      >
        {/* Left: Icon & Count with pop effect */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
            <ShoppingBag className={`w-5 h-5 text-white transition-transform ${bump ? 'rotate-12' : ''}`} />
            <span
              className={`absolute -top-1.5 -right-1.5 bg-white text-orange-700 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 ${
                bump ? 'scale-125' : 'scale-100'
              }`}
            >
              {totalCount}
            </span>
          </div>

          <div className="text-left">
            <span className="text-[11px] uppercase tracking-wider font-bold text-orange-100 block">
              Tu Pedido ({totalCount} {totalCount === 1 ? 'platillo' : 'platillos'})
            </span>
            <span className="text-base font-black text-white tracking-tight">
              {formatCurrency(totalPrice, currency)}
            </span>
          </div>
        </div>

        {/* Right: CTA button */}
        <div className="flex items-center gap-1.5 font-black text-xs bg-white text-orange-700 py-2 px-3.5 rounded-xl shadow-md group-hover:bg-orange-50 transition-colors">
          <span>Ver Carrito</span>
          <ArrowRight className="w-4 h-4 animate-pulse" />
        </div>
      </button>
    </div>
  );
}
