import React from 'react';
import { Flame, Star, Sparkles, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Badge({ type, label, size = 'sm' }) {
  const sizeClasses = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5'
    : size === 'md'
    ? 'text-xs px-2.5 py-1'
    : 'text-[11px] px-2 py-0.5';

  switch (type) {
    case 'promotion':
    case 'promocion':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-red-100 text-red-700 border border-red-200 ${sizeClasses}`}>
          <Tag className="w-3 h-3" />
          {label || 'Promoción'}
        </span>
      );
    case 'featured':
    case 'favorito':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
          {label || 'Favorito'}
        </span>
      );
    case 'bestSeller':
    case 'masVendido':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200 ${sizeClasses}`}>
          <Flame className="w-3 h-3 text-orange-600 fill-orange-500" />
          {label || 'Más vendido'}
        </span>
      );
    case 'new':
    case 'nuevo':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
          <Sparkles className="w-3 h-3 text-emerald-600" />
          {label || 'Nuevo'}
        </span>
      );
    case 'soldOut':
    case 'agotado':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-stone-200 text-stone-700 border border-stone-300 ${sizeClasses}`}>
          <AlertCircle className="w-3 h-3" />
          {label || 'Agotado'}
        </span>
      );
    case 'available':
    case 'disponible':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-green-600" />
          {label || 'Disponible'}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-stone-100 text-stone-700 border border-stone-200 ${sizeClasses}`}>
          {label}
        </span>
      );
  }
}
