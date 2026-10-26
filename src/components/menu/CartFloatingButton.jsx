import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function CartFloatingButton({
  totalCount = 0,
  totalPrice = 0,
  currency = 'MXN',
  onClick
}) {
  if (totalCount <= 0) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center animate-bounce-in">
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto w-full max-w-lg bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between transition-all border border-orange-500/30"
      >
        {/* Left: Icon & Count */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-orange-700/80 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
            <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-700 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
              {totalCount}
            </span>
          </div>

          <div className="text-left">
            <span className="text-xs uppercase tracking-wider font-bold text-orange-200 block">
              Tu Pedido ({totalCount} {totalCount === 1 ? 'platillo' : 'platillos'})
            </span>
            <span className="text-base font-black text-white">
              {formatCurrency(totalPrice, currency)}
            </span>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-1.5 font-bold text-xs bg-white text-orange-600 py-2 px-3.5 rounded-xl shadow-sm">
          <span>Ver Carrito</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
}
