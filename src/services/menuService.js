// Service to fetch public menu data
export async function getPublicMenu(forceRefresh = false) {
  const url = forceRefresh
    ? `/.netlify/functions/menu?t=${Date.now()}`
    : '/.netlify/functions/menu';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'No se pudo cargar el menú');
  }

  return await response.json();
}
