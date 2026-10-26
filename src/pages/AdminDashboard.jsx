import React from 'react';
import { formatDate, formatCurrency } from '../utils/formatters';
import {
  UtensilsCrossed,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';

export default function AdminDashboard({
  products = [],
  categories = [],
  settings = {},
  onNavigateTab,
  onOpenCreateProduct,
  onOpenCreateCategory
}) {
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const availableCount = products.filter((p) => p.available !== false).length;
  const soldOutCount = products.filter((p) => p.available === false).length;
  const withPhotoCount = products.filter((p) => p.imageId || p.imageUrl).length;

  const lastUpdated = settings?.updatedAt || products[0]?.updatedAt;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-200 block mb-1">
            Resumen General del Menú
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            {settings.name || 'Menú Digital'}
          </h2>
          <p className="text-xs sm:text-sm text-orange-100 mt-1 max-w-xl">
            Toda la información mostrada está sincronizada en tiempo real mediante Netlify Blobs.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onOpenCreateProduct}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-orange-600 text-xs font-bold shadow hover:bg-orange-50 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              Nuevo Platillo
            </button>
            <button
              type="button"
              onClick={onOpenCreateCategory}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-700/60 hover:bg-orange-700 text-white text-xs font-bold border border-orange-400/40 transition"
            >
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Products */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">Total Platillos</span>
            <span className="text-2xl font-black text-stone-900">{totalProducts}</span>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">Categorías</span>
            <span className="text-2xl font-black text-stone-900">{totalCategories}</span>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">Disponibles</span>
            <span className="text-2xl font-black text-emerald-700">{availableCount}</span>
          </div>
        </div>

        {/* Sold Out */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">Agotados</span>
            <span className="text-2xl font-black text-rose-700">{soldOutCount}</span>
          </div>
        </div>
      </div>

      {/* Secondary Info & Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Persistence Status */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm md:col-span-2">
          <h3 className="font-bold text-sm text-stone-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            Estado de Persistencia y Almacenamiento
          </h3>
          <div className="space-y-3 text-xs text-stone-600">
            <div className="flex items-center justify-between py-2 border-b border-stone-100">
              <span className="text-stone-500">Motor de persistencia:</span>
              <span className="font-semibold text-stone-800">Netlify Blobs (JSON + Binarios)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-100">
              <span className="text-stone-500">Última actualización guardada:</span>
              <span className="font-semibold text-stone-800">{formatDate(lastUpdated)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-100">
              <span className="text-stone-500">Platillos con fotografía:</span>
              <span className="font-semibold text-stone-800">
                {withPhotoCount} de {totalProducts} ({Math.round((withPhotoCount / (totalProducts || 1)) * 100)}%)
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-stone-500">Moneda configurada:</span>
              <span className="font-semibold text-stone-800">{settings.currency || 'MXN'} ($)</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-stone-900 mb-3">Accesos Rápidos</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab('products')}
                className="w-full text-left py-2.5 px-3 rounded-xl bg-white hover:bg-orange-50 border border-stone-200/80 text-xs font-bold text-stone-800 flex items-center justify-between transition group"
              >
                <span>Administrar Productos ({totalProducts})</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('categories')}
                className="w-full text-left py-2.5 px-3 rounded-xl bg-white hover:bg-orange-50 border border-stone-200/80 text-xs font-bold text-stone-800 flex items-center justify-between transition group"
              >
                <span>Administrar Categorías ({totalCategories})</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="w-full text-left py-2.5 px-3 rounded-xl bg-white hover:bg-orange-50 border border-stone-200/80 text-xs font-bold text-stone-800 flex items-center justify-between transition group"
              >
                <span>Datos del Restaurante & WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
