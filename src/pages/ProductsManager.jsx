import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import Badge from '../components/shared/Badge';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Image as ImageIcon
} from 'lucide-react';

export default function ProductsManager({
  products = [],
  categories = [],
  currency = 'MXN',
  onOpenCreate,
  onOpenEdit,
  onToggleAvailability,
  onDeleteProduct
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all'); // all, available, soldOut
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Map of categories by ID
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  // Filter products
  const filtered = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }
      // Availability filter
      if (filterAvailability === 'available' && p.available === false) {
        return false;
      }
      if (filterAvailability === 'soldOut' && p.available !== false) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, selectedCategory, filterAvailability, searchQuery]);

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    } catch (err) {
      alert(err.message || 'Error al eliminar el producto');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-stone-900">Gestión de Platillos y Productos</h2>
          <p className="text-xs text-stone-500">
            {products.length} platillos registrados en Netlify Blobs
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o ingrediente..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="all">Todas las categorías ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="all">Todo el inventario</option>
            <option value="available">Solo disponibles</option>
            <option value="soldOut">Solo agotados</option>
          </select>
        </div>
      </div>

      {/* Products List / Cards */}
      {filtered.length > 0 ? (
        <div className="space-y-2.5">
          {filtered.map((prod) => {
            const isAvailable = prod.available !== false;
            const categoryName = categoryMap.get(prod.categoryId) || 'Sin categoría';

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-sm transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  !isAvailable
                    ? 'border-stone-200 bg-stone-50/70 opacity-80'
                    : 'border-stone-200/90 hover:border-orange-200'
                }`}
              >
                {/* Left info with thumbnail */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 relative border border-stone-200">
                    {prod.displayImageUrl || prod.imageUrl ? (
                      <img
                        src={prod.displayImageUrl || prod.imageUrl}
                        alt={prod.name}
                        className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                        <span className="text-[9px] font-black text-white px-1 py-0.5 rounded bg-stone-800">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-stone-900 truncate">
                        {prod.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-stone-500 px-2 py-0.5 bg-stone-100 rounded-full">
                        {categoryName}
                      </span>
                    </div>

                    {prod.description && (
                      <p className="text-xs text-stone-500 truncate mt-0.5 max-w-lg">
                        {prod.description}
                      </p>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {prod.promotion && <Badge type="promotion" label="Promo" size="xs" />}
                      {prod.bestSeller && <Badge type="bestSeller" label="Más vendido" size="xs" />}
                      {prod.featured && <Badge type="featured" label="Favorito" size="xs" />}
                      {prod.isNew && <Badge type="new" label="Nuevo" size="xs" />}
                      <span className="text-[10px] text-stone-400 font-mono">
                        Orden #{prod.sortOrder || 1}
                      </span>
                      {prod.maxCombinations > 0 ? (
                        <span className="text-[10px] font-bold text-orange-800 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded">
                          ✨ Combina {prod.maxCombinations} ing.
                        </span>
                      ) : Array.isArray(prod.ingredients) && prod.ingredients.length > 0 ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          {prod.ingredients.length} ing. base
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Right controls: Price, Availability, Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-stone-400 block font-medium">Precio</span>
                    <span className="text-base font-black text-stone-900">
                      {formatCurrency(prod.price, currency)}
                    </span>
                  </div>

                  {/* 1-Click Availability Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleAvailability(prod)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                    title={isAvailable ? 'Marcar como agotado' : 'Marcar como disponible'}
                  >
                    {isAvailable ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Disponible</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Agotado</span>
                      </>
                    )}
                  </button>

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => onOpenEdit(prod)}
                    className="p-2 rounded-xl text-stone-600 hover:text-orange-600 hover:bg-orange-50 border border-stone-200 transition"
                    title="Editar platillo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => setProductToDelete(prod)}
                    className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 border border-stone-200 transition"
                    title="Eliminar platillo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
          <UtensilsCrossed className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-stone-700">No se encontraron platillos</p>
          <p className="text-xs text-stone-400 mt-1">Prueba cambiando los filtros o crea un nuevo producto.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar platillo?"
        message={`¿Estás seguro de que deseas eliminar permanentemente "${productToDelete?.name}"? Esta acción se guardará de inmediato en Netlify Blobs.`}
        confirmText="Sí, eliminar platillo"
      />
    </div>
  );
}
