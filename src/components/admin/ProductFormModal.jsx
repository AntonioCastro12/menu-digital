import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { formatCurrency } from '../../utils/formatters';
import { compressAndResizeImage, uploadImageToServer } from '../../services/imageService';
import {
  Camera,
  Upload,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Sparkles,
  Layers,
  Sliders
} from 'lucide-react';

const COMMON_BASE_INGREDIENTS = [
  'Cilantro',
  'Cebolla picada',
  'Piña asada',
  'Salsa taquera',
  'Queso fundido',
  'Aguacate fresco',
  'Crema ácida',
  'Frijoles refritos',
  'Orégano',
  'Limón'
];

const COMMON_COMBINATION_OPTIONS = [
  'Carne al Pastor',
  'Bistec asado',
  'Longaniza doradita',
  'Suadero tradicional',
  'Arrachera',
  'Peperoni',
  'Jamón de pierna',
  'Champiñones frescos',
  'Piña asada',
  'Tocino ahumado',
  'Queso de cabra',
  'Pimiento morrón'
];

export default function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  categories = [],
  product = null
}) {
  const isEditing = Boolean(product && product.id);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
    available: true,
    featured: false,
    promotion: false,
    bestSeller: false,
    isNew: false,
    sortOrder: 1,
    imageId: '',
    imageUrl: '',
    customizationMode: 'none', // 'none' | 'remove' | 'combine'
    maxCombinations: 2,
    minCombinations: 1,
    combinationOptions: [],
    ingredients: []
  });

  const [newBaseIngredient, setNewBaseIngredient] = useState('');
  const [newCombOption, setNewCombOption] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when product opens
  useEffect(() => {
    if (product) {
      const mode =
        product.customizationMode ||
        (product.maxCombinations > 0 ? 'combine' : product.ingredients?.length > 0 ? 'remove' : 'none');

      setFormData({
        name: product.name || '',
        price: product.price !== undefined ? product.price.toString() : '',
        categoryId: product.categoryId || (categories[0]?.id || ''),
        description: product.description || '',
        available: product.available !== false,
        featured: Boolean(product.featured),
        promotion: Boolean(product.promotion),
        bestSeller: Boolean(product.bestSeller),
        isNew: Boolean(product.isNew),
        sortOrder: product.sortOrder || 1,
        imageId: product.imageId || '',
        imageUrl: product.imageUrl || '',
        customizationMode: mode,
        maxCombinations: product.maxCombinations || 2,
        minCombinations: product.minCombinations || 1,
        combinationOptions: Array.isArray(product.combinationOptions) ? product.combinationOptions : [],
        ingredients: Array.isArray(product.ingredients) ? product.ingredients : []
      });
      setImagePreview(product.displayImageUrl || product.imageUrl || '');
    } else {
      setFormData({
        name: '',
        price: '',
        categoryId: categories[0]?.id || '',
        description: '',
        available: true,
        featured: false,
        promotion: false,
        bestSeller: false,
        isNew: false,
        sortOrder: 1,
        imageId: '',
        imageUrl: '',
        customizationMode: 'none',
        maxCombinations: 2,
        minCombinations: 1,
        combinationOptions: [],
        ingredients: []
      });
      setImagePreview('');
    }
    setSelectedImageFile(null);
    setNewBaseIngredient('');
    setNewCombOption('');
    setErrorMsg('');
  }, [product, categories, isOpen]);

  // Handle local file selection and client-side compression
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setIsProcessingImage(true);

    try {
      const processed = await compressAndResizeImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.85
      });

      setSelectedImageFile(processed);
      setImagePreview(processed.dataUrl);
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la fotografía seleccionada');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedImageFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, imageId: '', imageUrl: '' }));
  };

  // Add Base Ingredient helper (desmarcar)
  const handleAddBaseIngredient = (name) => {
    const clean = (name || newBaseIngredient).trim();
    if (!clean) return;
    if (!formData.ingredients.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, clean]
      }));
    }
    setNewBaseIngredient('');
  };

  const handleRemoveBaseIngredient = (index) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  // Add Combination Option helper (combinar)
  const handleAddCombOption = (name) => {
    const clean = (name || newCombOption).trim();
    if (!clean) return;
    if (!formData.combinationOptions.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        combinationOptions: [...prev.combinationOptions, clean]
      }));
    }
    setNewCombOption('');
  };

  const handleRemoveCombOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      combinationOptions: prev.combinationOptions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Frontend Validations
    if (!formData.name.trim()) {
      setErrorMsg('El nombre del platillo o producto es obligatorio.');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMsg('El precio debe ser un número válido mayor o igual a 0.');
      return;
    }

    if (!formData.categoryId) {
      setErrorMsg('Debes seleccionar una categoría para el producto.');
      return;
    }

    if (formData.customizationMode === 'combine' && formData.combinationOptions.length < 2) {
      setErrorMsg('En el modo combinar, debes agregar al menos 2 opciones de ingredientes para que el cliente elija.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageId = formData.imageId;

      // If a new photo was selected, upload it to Netlify Blobs now
      if (selectedImageFile) {
        const uploadResult = await uploadImageToServer(
          selectedImageFile.dataUrl,
          selectedImageFile.fileName
        );
        finalImageId = uploadResult.imageId;
      }

      const isNone = formData.customizationMode === 'none';
      const isCombine = formData.customizationMode === 'combine';

      const payload = {
        ...(product?.id ? { id: product.id } : {}),
        name: formData.name.trim(),
        price: priceNum,
        categoryId: formData.categoryId,
        description: formData.description.trim(),
        available: formData.available,
        featured: formData.featured,
        promotion: formData.promotion,
        bestSeller: formData.bestSeller,
        isNew: formData.isNew,
        sortOrder: parseInt(formData.sortOrder, 10) || 1,
        imageId: finalImageId,
        imageUrl: finalImageId ? '' : formData.imageUrl,
        customizationMode: formData.customizationMode,
        maxCombinations: isCombine ? (parseInt(formData.maxCombinations, 10) || 2) : 0,
        minCombinations: isCombine ? (parseInt(formData.minCombinations, 10) || 1) : 0,
        combinationOptions: isCombine ? formData.combinationOptions : [],
        ingredients: isNone ? [] : formData.ingredients
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Name and Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nombre del producto *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Taco Combinado / Pizza 3 Ingredientes"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Precio (MXN) *
            </label>
            <input
              type="number"
              step="0.50"
              min="0"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="95.00"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-stone-900"
            />
          </div>
        </div>

        {/* Live Price Preview */}
        {formData.price && !isNaN(parseFloat(formData.price)) && (
          <div className="text-right text-xs text-stone-500">
            Vista previa del precio:{' '}
            <span className="font-extrabold text-orange-600 text-sm">
              {formatCurrency(parseFloat(formData.price))}
            </span>
          </div>
        )}

        {/* Category & Order */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Categoría *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Orden en la lista
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Descripción general
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Breve reseña del platillo, tamaño de porción, etc."
            className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* --- TIPO DE PERSONALIZACIÓN DEL PLATILLO --- */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-orange-600" />
            <label className="text-xs font-black uppercase text-stone-900">
              Personalización de ingredientes por el cliente
            </label>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-stone-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, customizationMode: 'none' })}
              className={`py-2 px-1 rounded-lg transition text-center ${
                formData.customizationMode === 'none'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sin Opciones
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, customizationMode: 'remove' })}
              className={`py-2 px-1 rounded-lg transition text-center ${
                formData.customizationMode === 'remove'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Quitar Ingredientes
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, customizationMode: 'combine' })}
              className={`py-2 px-1 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                formData.customizationMode === 'combine'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Combinar (2, 3, 4...)</span>
            </button>
          </div>

          {/* CASO 1: COMBINAR INGREDIENTES CON LÍMITE (EJ. 2, 3, 4 INGREDIENTES) */}
          {formData.customizationMode === 'combine' && (
            <div className="p-3 bg-white rounded-xl border border-orange-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">
                    ¿Cuántos ingredientes puede combinar el cliente?
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Ej. 2 para "Taco de 2 carnes", 3 o 4 para "Pizza familiar de 3 o 4 ingredientes".
                  </span>
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex items-center gap-1">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          maxCombinations: num,
                          minCombinations: Math.min(formData.minCombinations, num)
                        })
                      }
                      className={`w-9 h-8 rounded-lg text-xs font-black transition ${
                        formData.maxCombinations === num
                          ? 'bg-orange-600 text-white shadow'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input for options */}
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-700">
                  Opciones disponibles para combinar (lista de ingredientes/carnes):
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCombOption}
                    onChange={(e) => setNewCombOption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCombOption();
                      }
                    }}
                    placeholder="Escribe una opción (ej. Pastor, Peperoni, Suadero, Jamón...)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCombOption()}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Suggestion pills */}
                <div>
                  <span className="text-[10px] font-bold text-stone-400 block mb-1">
                    Sugerencias rápidas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_COMBINATION_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleAddCombOption(opt)}
                        className="text-[11px] font-medium bg-stone-50 hover:bg-orange-50 text-stone-600 hover:text-orange-700 border border-stone-200 px-2 py-0.5 rounded-lg transition"
                      >
                        + {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chips of added options */}
                {formData.combinationOptions.length > 0 && (
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[11px] font-bold text-orange-950 block mb-1.5">
                      Opciones configuradas ({formData.combinationOptions.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.combinationOptions.map((opt, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200 shadow-sm"
                        >
                          <span>{opt}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCombOption(idx)}
                            className="p-0.5 hover:bg-orange-200 rounded-md text-orange-700 transition"
                            title="Eliminar opción"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CASO 2: INGREDIENTES BASE A DESMARCAR (EJ. SIN CEBOLLA, SIN CILANTRO) */}
          {(formData.customizationMode === 'remove' || formData.customizationMode === 'combine') && (
            <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-stone-800">
                  {formData.customizationMode === 'combine'
                    ? 'Ingredientes base adicionales (que el cliente puede pedir "Sin"):'
                    : 'Ingredientes incluidos que el cliente puede deseleccionar:'}
                </label>
                <p className="text-[11px] text-stone-500">
                  Si el comensal no le gusta uno de estos, lo desmarcará al pedir (ej. Sin cilantro, Sin cebolla).
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBaseIngredient}
                  onChange={(e) => setNewBaseIngredient(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBaseIngredient();
                    }
                  }}
                  placeholder="Ej. Cilantro, Cebolla, Piña..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddBaseIngredient()}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_BASE_INGREDIENTS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddBaseIngredient(sug)}
                    className="text-[11px] font-medium bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 px-2 py-0.5 rounded-lg transition"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              {/* Base ingredients chips */}
              {formData.ingredients.length > 0 && (
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-[11px] font-bold text-stone-700 block mb-1">
                    Ingredientes base ({formData.ingredients.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.ingredients.map((ing, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-stone-100 text-stone-800 border border-stone-200 shadow-sm"
                      >
                        <span>{ing}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBaseIngredient(idx)}
                          className="p-0.5 hover:bg-stone-200 rounded-md text-stone-700 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Photo Upload & Preview */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Fotografía del platillo 
          </label>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Image Preview Box */}
            <div className="w-full sm:w-36 h-28 bg-stone-100 rounded-xl border-2 border-dashed border-stone-300 overflow-hidden flex items-center justify-center relative flex-shrink-0">
              {isProcessingImage ? (
                <div className="flex flex-col items-center gap-1 text-orange-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-[10px]">Optimizando...</span>
                </div>
              ) : imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <span className="text-xs text-stone-400 text-center px-2">
                  Sin foto seleccionada
                </span>
              )}
            </div>

            {/* Actions for Camera & File Picker */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex gap-2">
                {/* Standard file picker */}
                <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir archivo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Mobile Camera direct trigger */}
                <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-orange-50 border border-orange-200 hover:bg-orange-100 text-xs font-bold text-orange-700 transition">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Tomar foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-stone-400">
                Se optimizará y comprimirá automáticamente a WebP antes de subirse.
              </p>
            </div>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="pt-2 border-t border-stone-200">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.available}
              onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
            />
            <span className="text-xs font-bold text-stone-800">
              Producto disponible (desmarcar para mostrar como "Agotado")
            </span>
          </label>
        </div>

        {/* Badges / Promotion Checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.promotion}
              onChange={(e) => setFormData({ ...formData, promotion: e.target.checked })}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span>Promoción</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.bestSeller}
              onChange={(e) => setFormData({ ...formData, bestSeller: e.target.checked })}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span>Más vendido</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span>Favorito</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isNew}
              onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span>Nuevo</span>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="py-2.5 px-4 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isProcessingImage}
            className="inline-flex items-center gap-2 py-2.5 px-5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Guardar Producto</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
