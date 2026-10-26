import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Badge from '../shared/Badge';
import { formatCurrency, buildWhatsAppLink } from '../../utils/formatters';
import {
  MessageCircle,
  Utensils,
  Plus,
  Minus,
  Check,
  X,
  ShoppingBag,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  restaurantSettings,
  onAddToCart
}) {
  // Selected combinations set (e.g. 2, 3 or 4 ingredients)
  const [selectedCombinations, setSelectedCombinations] = useState([]);
  const [combValidationMsg, setCombValidationMsg] = useState('');

  // Selected base ingredients (defaults to all selected; uncheck to exclude)
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');
  const [addedToast, setAddedToast] = useState(false);

  // Reset state on product change or modal open
  useEffect(() => {
    if (product) {
      setSelectedCombinations([]);
      setSelectedIngredients(Array.isArray(product.ingredients) ? product.ingredients : []);
      setQuantity(1);
      setSpecialNotes('');
      setCombValidationMsg('');
      setAddedToast(false);
    }
  }, [product, isOpen]);

  if (!product || !isOpen) return null;

  const {
    name = '',
    description = '',
    price = 0,
    displayImageUrl = '',
    categoryName = '',
    available = true,
    featured = false,
    promotion = false,
    bestSeller = false,
    isNew = false,
    ingredients = [],
    customizationMode = 'none',
    maxCombinations = 0,
    minCombinations = 0,
    combinationOptions = []
  } = product;

  const allCombOptions = Array.isArray(combinationOptions) ? combinationOptions : [];
  const isCombineMode =
    customizationMode !== 'none' &&
    (customizationMode === 'combine' || maxCombinations > 0) &&
    allCombOptions.length > 0;
  const maxComb = isCombineMode ? (maxCombinations || 0) : 0;
  const minComb = isCombineMode ? (minCombinations || (maxComb > 0 ? 1 : 0)) : 0;

  const phone = restaurantSettings?.whatsapp || restaurantSettings?.phone || '';
  const currency = restaurantSettings?.currency || 'MXN';
  const totalPrice = (price || 0) * quantity;
  const formattedTotalPrice = formatCurrency(totalPrice, currency);

  // Toggle combination option (with max limits check)
  const handleToggleCombination = (option) => {
    setCombValidationMsg('');
    if (selectedCombinations.includes(option)) {
      setSelectedCombinations((prev) => prev.filter((o) => o !== option));
    } else {
      if (maxComb > 0 && selectedCombinations.length >= maxComb) {
        setCombValidationMsg(`Límite alcanzado: solo puedes elegir ${maxComb} ingredientes. Desmarca uno para cambiarlo.`);
        return;
      }
      setSelectedCombinations((prev) => [...prev, option]);
    }
  };

  // Toggle base ingredient selection (uncheck to exclude)
  const handleToggleIngredient = (ingredientName) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredientName)
        ? prev.filter((i) => i !== ingredientName)
        : [...prev, ingredientName]
    );
  };

  // Compute excluded base ingredients
  const allBaseIngredients = Array.isArray(ingredients) ? ingredients : [];
  const excludedIngredients = allBaseIngredients.filter((i) => !selectedIngredients.includes(i));

  // Handle Add to Cart
  const handleAdd = () => {
    // Validate combination min requirements
    if (isCombineMode && minComb > 0 && selectedCombinations.length < minComb) {
      setCombValidationMsg(
        `Por favor selecciona al menos ${minComb} ${
          minComb === 1 ? 'ingrediente' : 'ingredientes'
        } para continuar (${selectedCombinations.length}/${minComb} seleccionados).`
      );
      return;
    }

    if (onAddToCart) {
      onAddToCart(product, {
        quantity,
        excludedIngredients,
        selectedCombinations,
        notes: specialNotes.trim()
      });
      setAddedToast(true);
      setTimeout(() => {
        setAddedToast(false);
        onClose();
      }, 700);
    }
  };

  // Direct WhatsApp message with customizations
  const directMessage = () => {
    let msg = `¡Hola! Me gustaría pedir desde el menú digital:\n*${quantity}x ${name}* (${formattedTotalPrice})`;
    if (selectedCombinations.length > 0) {
      msg += `\n✨ *Combinación:* ${selectedCombinations.join(' + ')}`;
    }
    if (excludedIngredients.length > 0) {
      msg += `\n❌ *Sin:* ${excludedIngredients.join(', ')}`;
    }
    if (specialNotes.trim()) {
      msg += `\n📝 *Nota:* ${specialNotes.trim()}`;
    }
    return msg;
  };

  const directWaUrl = buildWhatsAppLink(phone, directMessage());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryName || 'Detalle del Platillo'}
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        {/* Full Image */}
        <div className="relative aspect-video sm:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
              <Utensils className="w-12 h-12 mb-1" />
              <span className="text-xs">Sin fotografía</span>
            </div>
          )}

          {/* Availability banner */}
          {!available && (
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-4 py-1.5 rounded-full text-sm font-bold text-white bg-rose-600 shadow-lg">
                Actualmente agotado
              </span>
            </div>
          )}
        </div>

        {/* Badges strip */}
        <div className="flex flex-wrap gap-1.5">
          {!available && <Badge type="soldOut" label="Agotado" />}
          {available && promotion && <Badge type="promotion" label="En promoción" />}
          {available && bestSeller && <Badge type="bestSeller" label="Más vendido" />}
          {available && featured && <Badge type="featured" label="Recomendación de la casa" />}
          {available && isNew && <Badge type="new" label="Nuevo platillo" />}
          {isCombineMode && maxComb > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
              <Sparkles className="w-3 h-3 text-orange-600" />
              Combina hasta {maxComb} ingredientes
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
            {name}
          </h2>
          {description && (
            <p className="mt-1.5 text-xs sm:text-sm text-stone-600 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* --- 1. MODO COMBINAR INGREDIENTES (Elige 2, 3 o 4 ingredientes) --- */}
        {available && isCombineMode && allCombOptions.length > 0 && (
          <div className="p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-orange-950">
                  Arma tu combinación
                </h3>
              </div>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  selectedCombinations.length === maxComb
                    ? 'bg-emerald-600 text-white'
                    : 'bg-orange-200 text-orange-900'
                }`}
              >
                {selectedCombinations.length} de {maxComb} seleccionados
              </span>
            </div>

            <p className="text-[11px] text-stone-600">
              Selecciona hasta <strong>{maxComb} ingredientes</strong> para preparar este platillo a tu gusto:
            </p>

            {/* Combination buttons grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {allCombOptions.map((opt) => {
                const isSelected = selectedCombinations.includes(opt);
                const isMaxReached = !isSelected && maxComb > 0 && selectedCombinations.length >= maxComb;

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleToggleCombination(opt)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left border ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : isMaxReached
                        ? 'bg-stone-100 text-stone-400 border-stone-200 opacity-60 cursor-not-allowed'
                        : 'bg-white text-stone-800 border-stone-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    <span className="truncate pr-1">{opt}</span>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                        isSelected ? 'bg-white text-orange-600' : 'border border-stone-300'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Validation alert */}
            {combValidationMsg && (
              <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-1.5 mt-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>{combValidationMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* --- 2. INGREDIENTES BASE (Deseleccionar lo que no te guste) --- */}
        {available && allBaseIngredients.length > 0 && (
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Ingredientes que incluye el platillo
              </h3>
              <span className="text-[11px] text-stone-400">Toca para desmarcar</span>
            </div>
            <p className="text-[11px] text-stone-500">
              ¿No te gusta algún ingrediente? Desmárcalo y la cocina no se lo pondrá:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {allBaseIngredients.map((ing) => {
                const isSelected = selectedIngredients.includes(ing);
                return (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => handleToggleIngredient(ing)}
                    className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-300 line-through opacity-80'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    <span>{isSelected ? ing : `Sin ${ing}`}</span>
                  </button>
                );
              })}
            </div>

            {excludedIngredients.length > 0 && (
              <div className="mt-2 text-xs font-bold text-rose-600 bg-rose-50/80 px-2.5 py-1.5 rounded-lg border border-rose-200">
                ⚠️ Se preparará SIN: {excludedIngredients.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Special Instructions Input */}
        {available && (
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Indicaciones especiales para la cocina (opcional)
            </label>
            <input
              type="text"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Ej. Salsa aparte, carne bien doradita, sin sal..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        )}

        {/* Quantity and Actions Bar */}
        {available && (
          <div className="pt-3 border-t border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-400 block">
                  Total por {quantity} {quantity === 1 ? 'unidad' : 'unidades'}
                </span>
                <span className="text-2xl font-black text-stone-900">
                  {formattedTotalPrice}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-stone-700 hover:bg-stone-50 active:scale-95 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-black text-stone-900 text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-orange-600 text-white shadow-sm flex items-center justify-center hover:bg-orange-700 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Buttons: Add to Cart and Direct WhatsApp */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition active:scale-95 flex items-center justify-center gap-2 ${
                  addedToast
                    ? 'bg-emerald-600'
                    : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
                }`}
              >
                {addedToast ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Agregado al carrito!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Agregar al Carrito • {formattedTotalPrice}</span>
                  </>
                )}
              </button>

              {phone && (
                <a
                  href={directWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Pedir directo</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
