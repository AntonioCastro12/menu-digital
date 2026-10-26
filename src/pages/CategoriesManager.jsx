import React, { useState } from 'react';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { Plus, Edit2, Trash2, FolderTree, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CategoriesManager({
  categories = [],
  onOpenCreate,
  onOpenEdit,
  onDeleteCategory
}) {
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setErrorMessage('');
    setIsDeleting(true);

    try {
      await onDeleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    } catch (err) {
      setErrorMessage(err.message || 'No se pudo eliminar la categoría.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-stone-900">Gestión de Categorías</h2>
          <p className="text-xs text-stone-500">
            Organiza las secciones del menú visibles para tus comensales
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
        {categories.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {categories.map((cat) => {
              const count = cat.productCount || 0;
              const isActive = cat.active !== false;

              return (
                <div
                  key={cat.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      #{cat.sortOrder || 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-stone-900">
                          {cat.name}
                        </h3>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                            Inactiva
                          </span>
                        )}
                      </div>

                      {cat.description && (
                        <p className="text-xs text-stone-500 mt-0.5">{cat.description}</p>
                      )}

                      <span className="text-[11px] font-semibold text-stone-400 mt-1 block">
                        {count} platillo(s) asignado(s)
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onOpenEdit(cat)}
                      className="p-2 rounded-xl text-stone-600 hover:text-orange-600 hover:bg-orange-50 border border-stone-200 transition"
                      title="Editar categoría"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setCategoryToDelete(cat);
                      }}
                      className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 border border-stone-200 transition"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FolderTree className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-700">No hay categorías creadas</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar categoría?"
        message={
          categoryToDelete?.productCount > 0
            ? `ATENCIÓN: La categoría "${categoryToDelete?.name}" tiene ${categoryToDelete?.productCount} platillo(s) asociado(s). El backend de Netlify Blobs rechazará la eliminación hasta que reasignes o elimines primero esos productos.`
            : `¿Estás seguro de que deseas eliminar permanentemente la categoría "${categoryToDelete?.name}"?`
        }
        confirmText="Confirmar eliminación"
      />
    </div>
  );
}
