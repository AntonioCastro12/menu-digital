import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import Badge from '../shared/Badge';
import { Utensils, Plus } from 'lucide-react';

export default function ProductCard({ product, currency = 'MXN', onClick }) {
  const [imageError, setImageError] = useState(false);

  const {
    name,
    description,
    price,
    displayImageUrl,
    available = true,
    featured,
    promotion,
    bestSeller,
    isNew,
    ingredients = []
  } = product;

  const allCombOptions = Array.isArray(product.combinationOptions) ? product.combinationOptions : [];
  const isCombine =
    product.customizationMode !== 'none' &&
    (product.customizationMode === 'combine' || product.maxCombinations > 0) &&
    allCombOptions.length > 0;
  const maxComb = isCombine ? (product.maxCombinations || 0) : 0;
  const hasIngredients =
    product.customizationMode !== 'none' &&
    Array.isArray(ingredients) &&
    ingredients.length > 0;

  return (
    <div
      onClick={() => onClick(product)}
      className={`group relative bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between transform hover:-translate-y-1.5 ${
        !available ? 'opacity-75 bg-stone-50/80' : ''
      }`}
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden">
        {displayImageUrl && !imageError ? (
          <img
            src={displayImageUrl}
            alt={name}
            loading="lazy"
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 ${
              !available ? 'grayscale contrast-75' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 bg-stone-100 p-4">
            <Utensils className="w-10 h-10 mb-1 opacity-40 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-[11px] font-medium text-stone-400">Sin foto</span>
          </div>
        )}

        {/* Status / Feature Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap gap-1.5 items-center justify-between pointer-events-none">
          <div className="flex flex-wrap gap-1">
            {!available && <Badge type="soldOut" label="Agotado" size="xs" />}
            {available && promotion && <Badge type="promotion" label="Promo" size="xs" />}
            {available && bestSeller && <Badge type="bestSeller" label="Top" size="xs" />}
            {available && featured && <Badge type="featured" label="Favorito" size="xs" />}
            {available && isNew && <Badge type="new" label="Nuevo" size="xs" />}
          </div>
        </div>

        {/* Sold out semi-transparent banner */}
        {!available && (
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-stone-800/90 shadow">
              Temporalmente no disponible
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
            {name}
          </h3>
          {description && (
            <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {isCombine && maxComb > 0 ? (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-orange-800 font-bold bg-orange-100/80 px-2 py-0.5 rounded-md inline-flex border border-orange-200 shadow-xs">
              <span>✨ Combina hasta {maxComb} ingredientes</span>
            </div>
          ) : hasIngredients ? (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-flex border border-emerald-200">
              <span>{ingredients.length} ingredientes personalizables</span>
            </div>
          ) : null}
        </div>

        {/* Price & Action footer */}
        <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
              Precio
            </span>
            <span className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              {formatCurrency(price, currency)}
            </span>
          </div>

          <span className="text-xs font-black text-orange-600 bg-orange-50 group-hover:bg-orange-600 group-hover:text-white py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-90 flex items-center gap-1 shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </span>
        </div>
      </div>
    </div>
  );
}
