import { getRestaurantSettings, getCategories, getProducts } from './utils/blobStore.js';

export async function handler(event, context) {
  // Only allow GET or HEAD
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'GET, HEAD', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const [settings, categories, products] = await Promise.all([
      getRestaurantSettings(),
      getCategories(),
      getProducts()
    ]);

    // Filter active categories for public view
    const activeCategories = (categories || [])
      .filter(cat => cat.active !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // Active category IDs set for fast check
    const activeCategoryIds = new Set(activeCategories.map(c => c.id));

    // Sort products by sortOrder
    const sortedProducts = (products || [])
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(prod => ({
        ...prod,
        ingredients: Array.isArray(prod.ingredients) ? prod.ingredients : [],
        customizationMode: prod.customizationMode || (prod.maxCombinations > 0 ? 'combine' : (prod.ingredients?.length > 0 ? 'remove' : 'none')),
        maxCombinations: typeof prod.maxCombinations === 'number' ? prod.maxCombinations : 0,
        minCombinations: typeof prod.minCombinations === 'number' ? prod.minCombinations : 0,
        combinationOptions: Array.isArray(prod.combinationOptions) ? prod.combinationOptions : [],
        // Ensure image URL points to menu-image function if imageId exists
        displayImageUrl: prod.imageId
          ? `/.netlify/functions/menu-image?id=${prod.imageId}`
          : (prod.imageUrl || '')
      }));

    const responsePayload = {
      settings: {
        name: settings.name || 'Menú Digital',
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
        logoUrl: settings.logoId ? `/.netlify/functions/menu-image?id=${settings.logoId}` : (settings.logoUrl || ''),
        bannerUrl: settings.bannerId ? `/.netlify/functions/menu-image?id=${settings.bannerId}` : (settings.bannerUrl || ''),
        showContactInfo: settings.showContactInfo !== false,
        themeColor: settings.themeColor || '#ea580c',
        socialInstagram: settings.socialInstagram || '',
        socialFacebook: settings.socialFacebook || '',
        updatedAt: settings.updatedAt || new Date().toISOString()
      },
      categories: activeCategories,
      products: sortedProducts,
      serverTime: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // Fast edge caching: 10 seconds browser cache, 30 seconds stale-while-revalidate
        'Cache-Control': 'public, max-age=10, s-maxage=10, stale-while-revalidate=30',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(responsePayload)
    };
  } catch (error) {
    console.error('[menu] Error fetching public menu:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Error al consultar el menú',
        message: 'No fue posible cargar el menú en este momento. Por favor reintenta en breve.'
      })
    };
  }
}
