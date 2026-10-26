import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  MessageCircle,
  AlertTriangle,
  Store,
  MapPin,
  Utensils
} from 'lucide-react';
import { formatCurrency, buildWhatsAppLink } from '../../utils/formatters';
import { recordCustomerOrder } from '../../services/menuService';

export default function CartDrawer({
  isOpen,
  onClose,
  cart = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  totalPrice = 0,
  restaurantSettings = {}
}) {
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('dineIn'); // 'dineIn' | 'takeout' | 'delivery'
  const [tableNumber, setTableNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const currency = restaurantSettings?.currency || 'MXN';
  const whatsappNumber = restaurantSettings?.whatsapp || restaurantSettings?.phone || '';

  // Generate WhatsApp order message
  const handleSendOrder = () => {
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Por favor introduce tu nombre para el pedido.');
      return;
    }

    if (orderType === 'dineIn' && !tableNumber.trim()) {
      setFormError('Por favor indica tu número o nombre de mesa.');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setFormError('Por favor ingresa la dirección completa de entrega.');
      return;
    }

    // Compose formatted text for WhatsApp
    const lines = [];
    lines.push(`*¡NUEVO PEDIDO DESDE EL MENÚ DIGITAL!* 🍽️`);
    lines.push(`*${restaurantSettings?.name || 'Restaurante'}*`);
    lines.push(`--------------------------------------`);
    lines.push(`👤 *Cliente:* ${customerName.trim()}`);

    if (orderType === 'dineIn') {
      lines.push(`📍 *Modalidad:* Para comer aquí (Mesa: ${tableNumber.trim()})`);
    } else if (orderType === 'takeout') {
      lines.push(`🛍️ *Modalidad:* Para pasar a recoger al local`);
    } else {
      lines.push(`🛵 *Modalidad:* Entrega a domicilio`);
      lines.push(`📍 *Dirección:* ${deliveryAddress.trim()}`);
    }

    lines.push(`--------------------------------------`);
    lines.push(`*DETALLE DEL PEDIDO:*`);

    cart.forEach((item, idx) => {
      const lineTotal = item.price * item.quantity;
      lines.push(`\n${idx + 1}. *${item.quantity}x ${item.name}*`);
      lines.push(`   💵 Subtotal: ${formatCurrency(lineTotal, currency)} (${formatCurrency(item.price, currency)} c/u)`);

      // List of combined ingredients chosen
      if (item.selectedCombinations && item.selectedCombinations.length > 0) {
        lines.push(`   ✨ *Combinación:* ${item.selectedCombinations.join(' + ')}`);
      }

      // List of excluded ingredients
      if (item.excludedIngredients && item.excludedIngredients.length > 0) {
        lines.push(`   ❌ *SIN:* ${item.excludedIngredients.join(', ')}`);
      }

      // Individual item note
      if (item.notes) {
        lines.push(`   📝 *Nota:* ${item.notes}`);
      }
    });

    lines.push(`\n--------------------------------------`);
    lines.push(`💰 *TOTAL A PAGAR: ${formatCurrency(totalPrice, currency)}*`);

    if (generalNotes.trim()) {
      lines.push(`\n💬 *Notas adicionales:* ${generalNotes.trim()}`);
    }

    lines.push(`\n¡Muchas gracias! Quedo a la espera de su confirmación.`);

    const messageText = lines.join('\n');
    const waUrl = buildWhatsAppLink(whatsappNumber, messageText);

    // Save order in Netlify Blobs for real-time sales metrics
    recordCustomerOrder({
      customerName: customerName.trim(),
      orderType,
      tableNumber: tableNumber.trim(),
      deliveryAddress: deliveryAddress.trim(),
      notes: generalNotes.trim(),
      totalAmount: totalPrice,
      items: cart.map(it => ({
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        selectedCombinations: it.selectedCombinations || [],
        excludedIngredients: it.excludedIngredients || [],
        notes: it.notes || ''
      }))
    });

    // Open WhatsApp
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200/80 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-stone-900 leading-tight">
                  Tu Carrito de Compra
                </h2>
                <span className="text-xs text-stone-500">
                  {cart.length} {cart.length === 1 ? 'producto distinto' : 'productos distintos'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="p-1.5 text-xs text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition mr-1"
                  title="Vaciar carrito"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-stone-800 text-base">Tu carrito está vacío</h3>
                <p className="text-xs text-stone-400 max-w-xs mt-1">
                  Explora nuestro menú y añade los platillos y bebidas que desees ordenar.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow"
                >
                  Ver Menú
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200 flex flex-col gap-2 relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-stone-900 leading-snug">
                        {item.name}
                      </h4>
                      <span className="text-xs font-black text-orange-600">
                        {formatCurrency(item.price * item.quantity, currency)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[11px] text-stone-400 ml-1.5">
                          ({formatCurrency(item.price, currency)} c/u)
                        </span>
                      )}
                    </div>

                    {/* Delete item button */}
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.cartItemId)}
                      className="text-stone-400 hover:text-red-600 p-1 rounded-lg transition"
                      title="Quitar platillo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Combinación Elegida */}
                  {item.selectedCombinations && item.selectedCombinations.length > 0 && (
                    <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 text-[11px] text-orange-950 flex items-start gap-1.5 font-medium">
                      <span className="font-black text-orange-600">✨ Combinación:</span>
                      <span className="font-bold">{item.selectedCombinations.join(' + ')}</span>
                    </div>
                  )}

                  {/* Excluded Ingredients Badge (Personalización) */}
                  {item.excludedIngredients && item.excludedIngredients.length > 0 && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Sin: </span>
                        <span>{item.excludedIngredients.join(', ')}</span>
                      </div>
                    </div>
                  )}

                  {/* Item special notes */}
                  {item.notes && (
                    <div className="text-[11px] text-stone-500 italic pl-1 border-l-2 border-stone-300">
                      Nota: "{item.notes}"
                    </div>
                  )}

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 mt-1">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase">
                      Cantidad
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-extrabold text-sm text-stone-900 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white hover:bg-orange-700 transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Order Configuration Form (Only when cart has items) */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-stone-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Datos de entrega y consumo
                </h3>

                {formError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Delivery Type Selector */}
                <div className="grid grid-cols-3 gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold text-center">
                  <button
                    type="button"
                    onClick={() => setOrderType('dineIn')}
                    className={`py-2 px-1 rounded-lg transition ${
                      orderType === 'dineIn'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    En Mesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('takeout')}
                    className={`py-2 px-1 rounded-lg transition ${
                      orderType === 'takeout'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Para Llevar
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`py-2 px-1 rounded-lg transition ${
                      orderType === 'delivery'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    A Domicilio
                  </button>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tu nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Table Number if DineIn */}
                {orderType === 'dineIn' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Número o nombre de mesa *
                    </label>
                    <input
                      type="text"
                      required
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Ej. Mesa 4 / Terraza 2"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                {/* Delivery Address if Delivery */}
                {orderType === 'delivery' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Dirección de entrega completa *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Calle, número, colonia y referencias"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                {/* General Notes */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Comentarios o notas para la cocina (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    placeholder="Ej. Llevar limones extra, pagaré con billete de $500..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer with Total & WhatsApp Button */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-600">Total a pagar:</span>
                <span className="text-xl font-black text-stone-900">
                  {formatCurrency(totalPrice, currency)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSendOrder}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Enviar Pedido por WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
