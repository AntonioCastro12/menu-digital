import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSave,
  category = null,
  nextOrder = 1
}) {
  const isEditing = Boolean(category && category.id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
      setSortOrder(category.sortOrder || 1);
      setActive(category.active !== false);
    } else {
      setName('');
      setDescription('');
      setSortOrder(nextOrder);
      setActive(true);
    }
    setErrorMsg('');
  }, [category, isOpen, nextOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('El nombre de la categoría debe tener al menos 2 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...(category?.id ? { id: category.id } : {}),
        name: name.trim(),
        description: description.trim(),
        sortOrder: parseInt(sortOrder, 10) || 1,
        active
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Nombre de la categoría *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Tacos al Pastor, Bebidas, Postres"
            className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Descripción corta (opcional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve reseña que aparece bajo el encabezado"
            className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Orden en menú
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="pt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="text-xs font-bold text-stone-800">Categoría activa</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="py-2 px-4 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 py-2 px-5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Guardar Categoría</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
