import React from 'react';
import { MapPin, Clock, Phone, MessageCircle, AlertCircle, Utensils, ShoppingBag } from 'lucide-react';
import { buildWhatsAppLink } from '../../utils/formatters';

export default function MenuHeader({ settings, cartCount = 0, onOpenCart }) {
  const {
    name = 'Taquería & Cantina El Asador',
    tagline = 'Auténtico sabor al carbón y tradición mexicana',
    description = '',
    address = '',
    phone = '',
    whatsapp = '',
    whatsappMessage = '',
    hours = '',
    isOpen = true,
    closedMessage = '',
    logoUrl = '',
    bannerUrl = '',
    showContactInfo = true,
    themeColor = '#ea580c'
  } = settings || {};

  const waLink = buildWhatsAppLink(
    whatsapp || phone,
    whatsappMessage || `¡Hola! Me gustaría hacer un pedido desde el menú digital de ${name}.`
  );

  return (
    <header className="relative bg-white shadow-sm border-b border-stone-200/80">
      {/* Banner / Cover */}
      <div className="relative h-44 sm:h-56 md:h-64 w-full bg-stone-900 overflow-hidden">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={name}
            className="w-full h-full object-cover object-center opacity-85"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div
            className="w-full h-full opacity-90 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${themeColor} 0%, #431407 100%)`
            }}
          >
            <Utensils className="w-16 h-16 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/20" />

        {/* Business Status Pill & Quick Cart Top Bar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {cartCount > 0 && (
            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-600 text-white backdrop-blur-md shadow-lg border border-orange-400/40 hover:bg-orange-700 active:scale-95 transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Carrito ({cartCount})</span>
            </button>
          )}

          {isOpen ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/90 text-white backdrop-blur-md shadow-md border border-emerald-400/40">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Abierto
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600/90 text-white backdrop-blur-md shadow-md border border-rose-400/40">
              <span className="w-2 h-2 rounded-full bg-rose-200" />
              Cerrado
            </span>
          )}
        </div>
      </div>

      {/* Profile & Info Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-5">
        <div className="relative -mt-14 sm:-mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
          {/* Logo */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1 shadow-xl border-2 border-stone-100 flex-shrink-0 overflow-hidden relative z-10">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`Logo ${name}`}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div
                className="w-full h-full rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-inner"
                style={{ backgroundColor: themeColor }}
              >
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Restaurant Titles */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {name}
            </h1>
            {tagline && (
              <p className="text-sm font-medium text-stone-500 mt-0.5">
                {tagline}
              </p>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {cartCount > 0 && (
              <button
                type="button"
                onClick={onOpenCart}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ver Pedido ({cartCount})</span>
              </button>
            )}

            {whatsapp && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-700"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {/* Closed notice banner if closed */}
        {!isOpen && closedMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-2.5 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Aviso del restaurante: </span>
              {closedMessage}
            </div>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="mt-3 text-sm text-stone-600 leading-relaxed max-w-3xl">
            {description}
          </p>
        )}

        {/* Contact metadata strip */}
        {showContactInfo && (
          <div className="mt-4 pt-3.5 border-t border-stone-100 flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-5 text-xs text-stone-600">
            {hours && (
              <div className="inline-flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>{hours}</span>
              </div>
            )}
            {address && (
              <div className="inline-flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span>{address}</span>
              </div>
            )}
            {phone && (
              <a
                href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-1.5 font-medium hover:text-orange-600 transition"
              >
                <Phone className="w-3.5 h-3.5 text-orange-600" />
                <span>{phone}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
