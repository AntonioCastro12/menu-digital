import React, { useRef, useEffect } from 'react';

export default function CategoryNav({
  categories = [],
  activeCategory = 'all',
  onSelectCategory,
  categoryCounts = {}
}) {
  const containerRef = useRef(null);

  // Auto-scroll the active pill into view on mobile
  useEffect(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm py-2.5">
      <div
        ref={containerRef}
        className="max-w-4xl mx-auto px-4 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {/* All Products Pill */}
        <button
          type="button"
          data-active={activeCategory === 'all'}
          onClick={() => onSelectCategory('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all duration-300 transform active:scale-95 ${
            activeCategory === 'all'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md scale-105 ring-2 ring-orange-500/30'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 hover:scale-102'
          }`}
        >
          Todo el Menú
          {categoryCounts['all'] !== undefined && (
            <span
              className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                activeCategory === 'all' ? 'bg-orange-800/80 text-white' : 'bg-stone-200 text-stone-600'
              }`}
            >
              {categoryCounts['all']}
            </span>
          )}
        </button>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              data-active={isActive}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all duration-300 whitespace-nowrap transform active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md scale-105 ring-2 ring-orange-500/30'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 hover:scale-102'
              }`}
            >
              {cat.name}
              {count > 0 && (
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                    isActive ? 'bg-orange-800/80 text-white' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
