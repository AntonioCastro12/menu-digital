// Centralized service for admin operations

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('menu_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// 1. Authentication
export async function login(password) {
  const response = await fetch('/.netlify/functions/admin-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error de autenticación');
  }

  if (data.token) {
    localStorage.setItem('menu_admin_token', data.token);
  }

  return data;
}

export async function checkAuth() {
  const token = localStorage.getItem('menu_admin_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/.netlify/functions/admin-auth', {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function logout() {
  try {
    await fetch('/.netlify/functions/admin-logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.warn('Logout request error:', err);
  } finally {
    localStorage.removeItem('menu_admin_token');
  }
}

// 2. Settings
export async function getAdminSettings() {
  const response = await fetch('/.netlify/functions/admin-settings', {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al obtener configuración');
  return data;
}

export async function updateAdminSettings(settings) {
  const response = await fetch('/.netlify/functions/admin-settings', {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(settings)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al guardar configuración');
  return data;
}

// 3. Categories
export async function getAdminCategories() {
  const response = await fetch('/.netlify/functions/admin-categories', {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al obtener categorías');
  return data;
}

export async function createAdminCategory(categoryData) {
  const response = await fetch('/.netlify/functions/admin-categories', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(categoryData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al crear la categoría');
  return data;
}

export async function updateAdminCategory(categoryData) {
  const response = await fetch('/.netlify/functions/admin-categories', {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(categoryData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al actualizar la categoría');
  return data;
}

export async function deleteAdminCategory(id) {
  const response = await fetch(`/.netlify/functions/admin-categories?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al eliminar la categoría');
  return data;
}

// 4. Products
export async function getAdminProducts() {
  const response = await fetch('/.netlify/functions/admin-products', {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al obtener productos');
  return data;
}

export async function createAdminProduct(productData) {
  const response = await fetch('/.netlify/functions/admin-products', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(productData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al crear el producto');
  return data;
}

export async function updateAdminProduct(productData) {
  const response = await fetch('/.netlify/functions/admin-products', {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(productData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al actualizar el producto');
  return data;
}

export async function deleteAdminProduct(id) {
  const response = await fetch(`/.netlify/functions/admin-products?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al eliminar el producto');
  return data;
}

// 5. Orders & Sales Analytics
export async function getAdminOrders() {
  const response = await fetch('/.netlify/functions/admin-orders', {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al consultar métricas de ventas');
  return data;
}

export async function createAdminOrder(orderData) {
  const response = await fetch('/.netlify/functions/admin-orders', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(orderData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al registrar la venta');
  return data;
}

export async function clearAdminOrders() {
  const response = await fetch('/.netlify/functions/admin-orders', {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Error al reiniciar ventas');
  return data;
}
