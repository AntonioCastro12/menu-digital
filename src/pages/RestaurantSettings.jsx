import React, { useState, useEffect } from 'react';
import { compressAndResizeImage, uploadImageToServer } from '../services/imageService';
import { Check, Upload, Camera, AlertCircle, Loader2, Store, Phone, Clock, MapPin, Palette } from 'lucide-react';

export default function RestaurantSettings({ settings = {}, onSaveSettings }) {
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    address: '',
    phone: '',
    whatsapp: '',
    whatsappMessage: '',
    hours: '',
    currency: 'MXN',
    currencySymbol: '$',
    isOpen: true,
    closedMessage: '',
    showContactInfo: true,
    themeColor: '#ea580c',
    socialInstagram: '',
    socialFacebook: '',
    logoId: '',
    logoUrl: '',
    bannerId: '',
    bannerUrl: ''
  });

  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || '',
        tagline: settings.tagline || '',
        description: settings.description || '',
        address: settings.address || '',
        phone: settings.phone || '',
        whatsapp: settings.whatsapp || '',
        whatsappMessage: settings.whatsappMessage || '',
        hours: settings.hours || '',
        currency: settings.currency || 'MXN',
        currencySymbol: settings.currencySymbol || '$',
        isOpen: settings.isOpen !== false,
        closedMessage: settings.closedMessage || '',
        showContactInfo: settings.showContactInfo !== false,
        themeColor: settings.themeColor || '#ea580c',
        socialInstagram: settings.socialInstagram || '',
        socialFacebook: settings.socialFacebook || '',
        logoId: settings.logoId || '',
        logoUrl: settings.logoUrl || '',
        bannerId: settings.bannerId || '',
        bannerUrl: settings.bannerUrl || ''
      });
      setLogoPreview(settings.logoUrl || '');
      setBannerPreview(settings.bannerUrl || '');
    }
  }, [settings]);

  // Handle Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setIsUploadingLogo(true);

    try {
      const processed = await compressAndResizeImage(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.9
      });

      const uploaded = await uploadImageToServer(processed.dataUrl, 'logo.webp');
      setFormData((prev) => ({
        ...prev,
        logoId: uploaded.imageId,
        logoUrl: uploaded.url
      }));
      setLogoPreview(uploaded.url);
    } catch (err) {
      setErrorMessage(err.message || 'Error al subir el logotipo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle Banner Upload
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setIsUploadingBanner(true);

    try {
      const processed = await compressAndResizeImage(file, {
        maxWidth: 1600,
        maxHeight: 800,
        quality: 0.85
      });

      const uploaded = await uploadImageToServer(processed.dataUrl, 'banner.webp');
      setFormData((prev) => ({
        ...prev,
        bannerId: uploaded.imageId,
        bannerUrl: uploaded.url
      }));
      setBannerPreview(uploaded.url);
    } catch (err) {
      setErrorMessage(err.message || 'Error al subir la portada');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('El nombre comercial del restaurante es obligatorio');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSaveSettings(formData);
      setSuccessMessage('¡Configuración guardada exitosamente en Netlify Blobs!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Error al guardar la configuración');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-stone-900">Configuración del Restaurante</h2>
          <p className="text-xs text-stone-500">
            Personaliza los datos de contacto, horarios, imágenes y diseño visual
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow transition active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando en Blobs...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </>
          )}
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Basic Identity Section */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
          <Store className="w-4 h-4 text-orange-600" />
          Identidad Comercial
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nombre Comercial *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Lema o subtítulo (Tagline)
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Ej. Tacos al pastor y cortes al carbón"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Descripción de bienvenida
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Breve presentación de la cocina, especialidades e historia..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Logo and Banner uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Logo Picker */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Logotipo (Netlify Blobs)
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-300 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                {isUploadingLogo ? (
                  <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                ) : logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-stone-400">Sin logo</span>
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Cambiar Logotipo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Banner Picker */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Foto de Portada / Banner (Netlify Blobs)
            </label>
            <div className="flex items-center gap-3">
              <div className="w-24 h-16 rounded-xl bg-stone-100 border border-stone-300 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                {isUploadingBanner ? (
                  <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                ) : bannerPreview ? (
                  <img src={bannerPreview} alt="Portada" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-stone-400">Sin portada</span>
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-bold text-stone-700 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Cambiar Portada</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp & Contact Section */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
          <Phone className="w-4 h-4 text-emerald-600" />
          WhatsApp y Canales de Pedidos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Número de WhatsApp para pedidos (con clave de país)
            </label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="Ej. 525512345678 (México: 52 + 10 dígitos)"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
            <span className="text-[11px] text-stone-400 mt-1 block">
              Al hacer clic en "Pedir por WhatsApp", se abrirá un chat directo con este número.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Mensaje predefinido de WhatsApp
            </label>
            <input
              type="text"
              value={formData.whatsappMessage}
              onChange={(e) => setFormData({ ...formData, whatsappMessage: e.target.value })}
              placeholder="Ej. ¡Hola! Quisiera ordenar desde el menú digital."
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Teléfono fijo o celular del local
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="55 1234 5678"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Dirección física completa
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Av. Insurgentes Sur 1234, CDMX"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Schedule, Status and Theme */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
          <Clock className="w-4 h-4 text-orange-600" />
          Horarios y Estado del Negocio
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Horario de atención
            </label>
            <input
              type="text"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              placeholder="Mar - Dom: 13:00 a 23:00 hrs"
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Color principal del tema (Hexadecimal)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.themeColor}
                onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 p-0.5"
              />
              <input
                type="text"
                value={formData.themeColor}
                onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Business Open / Closed Switch */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.isOpen}
              onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
            />
            <span className="text-xs font-bold text-stone-900">
              Negocio abierto para servicio (desmarcar para mostrar aviso de negocio cerrado)
            </span>
          </label>

          {!formData.isOpen && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Mensaje de aviso de negocio cerrado
              </label>
              <input
                type="text"
                value={formData.closedMessage}
                onChange={(e) => setFormData({ ...formData, closedMessage: e.target.value })}
                placeholder="Por el momento estamos fuera de servicio. Te esperamos mañana a partir de la 1:00 PM."
                className="w-full px-3 py-2 text-sm rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
