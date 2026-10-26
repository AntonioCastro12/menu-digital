import React, { useState, useEffect } from 'react';
import { Utensils, Sparkles, ChefHat, ArrowDown, ChevronRight } from 'lucide-react';

export default function MenuIntroSplash({ settings = {}, onFinish }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(15);

  const restaurantName = settings.name || 'Menú Digital';
  const tagline = settings.tagline || 'Auténtico sabor casero';

  useEffect(() => {
    // Progress bar animation
    const p1 = setTimeout(() => setProgress(55), 300);
    const p2 = setTimeout(() => setProgress(88), 700);
    const p3 = setTimeout(() => setProgress(100), 1100);

    // Auto-dismiss after 1.5s
    const closeTimer = setTimeout(() => {
      handleClose();
    }, 1500);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
      clearTimeout(closeTimer);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 600);
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 bg-gradient-to-br from-stone-950 via-stone-900 to-orange-950 text-white transition-all duration-700 ease-in-out cursor-pointer select-none overflow-hidden ${
        isClosing
          ? '-translate-y-full opacity-0 scale-95 pointer-events-none'
          : 'translate-y-0 opacity-100 scale-100'
      }`}
    >
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-orange-600/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-amber-600/20 blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '700ms' }} />

      {/* Top Tag */}
      <div className="pt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-400 bg-orange-950/60 border border-orange-700/40 px-3.5 py-1.5 rounded-full shadow-inner animate-bounce">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
        <span>Menú Digital Interactivo</span>
      </div>

      {/* Main Center Brand Card */}
      <div className="flex flex-col items-center text-center max-w-sm px-4 my-auto space-y-5 animate-fade-in-up">
        {/* Animated Icon Avatar */}
        <div className="relative group">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 opacity-75 blur-lg group-hover:opacity-100 transition duration-1000 animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center shadow-2xl border-2 border-orange-400/50 transform hover:scale-105 transition-transform duration-300">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={restaurantName}
                className="w-full h-full object-cover rounded-3xl p-1"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <ChefHat className="w-12 h-12 text-white drop-shadow-md" />
            )}
          </div>
        </div>

        {/* Restaurant Name & Tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-amber-200 drop-shadow-sm leading-tight">
            {restaurantName}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-medium leading-relaxed max-w-xs mx-auto">
            {tagline}
          </p>
        </div>

        {/* Progress Loading Indicator */}
        <div className="w-64 space-y-2 pt-2">
          <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700/50">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-stone-400 tracking-wide block">
            {progress < 100 ? 'Sincronizando platillos del día...' : '¡Listo! Abriendo menú...'}
          </span>
        </div>
      </div>

      {/* Bottom Dismiss Tip */}
      <div className="pb-4 text-center">
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-stone-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition active:scale-95 shadow-sm"
        >
          <span>Toca para ver el menú</span>
          <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
        </button>
      </div>
    </div>
  );
}
