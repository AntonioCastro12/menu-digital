import { requireAdmin } from './utils/auth.js';
import { getRestaurantSettings, updateRestaurantSettings, initBlobs } from './utils/blobStore.js';

export async function handler(event, context) {
  initBlobs(event);

  // Security check: Must be authenticated admin
  const auth = requireAdmin(event);
  if (!auth.authorized) {
    return auth.response;
  }

  // GET: Fetch administrative settings
  if (event.httpMethod === 'GET') {
    try {
      const settings = await getRestaurantSettings();
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify(settings)
      };
    } catch (error) {
      console.error('[admin-settings] Read error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al obtener la configuración' })
      };
    }
  }

  // PUT: Update settings
  if (event.httpMethod === 'PUT') {
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'JSON malformado' })
      };
    }

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'El nombre comercial del restaurante es obligatorio' })
      };
    }

    // Sanitize theme color
    const themeColor = typeof body.themeColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(body.themeColor)
      ? body.themeColor
      : '#ea580c';

    const cleanSettings = {
      name: body.name.trim().slice(0, 100),
      tagline: (body.tagline || '').toString().slice(0, 150),
      description: (body.description || '').toString().slice(0, 500),
      address: (body.address || '').toString().slice(0, 200),
      phone: (body.phone || '').toString().slice(0, 30),
      whatsapp: (body.whatsapp || '').toString().replace(/[^0-9]/g, '').slice(0, 20),
      whatsappMessage: (body.whatsappMessage || '').toString().slice(0, 200),
      hours: (body.hours || '').toString().slice(0, 100),
      currency: (body.currency || 'MXN').toString().slice(0, 5),
      currencySymbol: (body.currencySymbol || '$').toString().slice(0, 3),
      isOpen: Boolean(body.isOpen),
      closedMessage: (body.closedMessage || '').toString().slice(0, 250),
      logoId: body.logoId ? body.logoId.toString() : '',
      logoUrl: body.logoUrl ? body.logoUrl.toString() : '',
      bannerId: body.bannerId ? body.bannerId.toString() : '',
      bannerUrl: body.bannerUrl ? body.bannerUrl.toString() : '',
      showContactInfo: body.showContactInfo !== false,
      themeColor,
      socialInstagram: (body.socialInstagram || '').toString().slice(0, 60),
      socialFacebook: (body.socialFacebook || '').toString().slice(0, 60)
    };

    try {
      const updated = await updateRestaurantSettings(cleanSettings);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
          success: true,
          message: 'Configuración actualizada exitosamente',
          settings: updated
        })
      };
    } catch (error) {
      console.error('[admin-settings] Update error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al guardar la configuración en Netlify Blobs' })
      };
    }
  }

  return {
    statusCode: 405,
    headers: { 'Allow': 'GET, PUT', 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Método no permitido' })
  };
}
