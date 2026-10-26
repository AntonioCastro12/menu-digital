import { requireAdmin } from './utils/auth.js';
import { getCategories, saveCategories, getProducts } from './utils/blobStore.js';

export async function handler(event, context) {
  const auth = requireAdmin(event);
  if (!auth.authorized) {
    return auth.response;
  }

  // GET: List all categories with product count
  if (event.httpMethod === 'GET') {
    try {
      const [categories, products] = await Promise.all([
        getCategories(),
        getProducts()
      ]);

      const countsByCat = {};
      (products || []).forEach(p => {
        countsByCat[p.categoryId] = (countsByCat[p.categoryId] || 0) + 1;
      });

      const enrichedCategories = (categories || []).map(cat => ({
        ...cat,
        productCount: countsByCat[cat.id] || 0
      })).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify(enrichedCategories)
      };
    } catch (error) {
      console.error('[admin-categories] GET error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al obtener las categorías' })
      };
    }
  }

  // POST: Create category
  if (event.httpMethod === 'POST') {
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Cuerpo de solicitud inválido (debe ser JSON)' })
      };
    }

    const name = (body.name || '').trim();
    if (!name || name.length < 2) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'El nombre de la categoría debe tener al menos 2 caracteres' })
      };
    }

    try {
      const categories = await getCategories();
      const newId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const maxSortOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder || 0), 0);

      const newCategory = {
        id: newId,
        name: name.slice(0, 60),
        description: (body.description || '').trim().slice(0, 160),
        sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : maxSortOrder + 1,
        active: body.active !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedList = [...categories, newCategory];
      await saveCategories(updatedList);

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
          success: true,
          message: 'Categoría creada exitosamente',
          category: newCategory
        })
      };
    } catch (error) {
      console.error('[admin-categories] POST error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al guardar la categoría' })
      };
    }
  }

  // PUT: Update category
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

    const { id, name, description, sortOrder, active } = body;
    if (!id || typeof id !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ID de categoría requerido' })
      };
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'El nombre debe tener al menos 2 caracteres' })
      };
    }

    try {
      const categories = await getCategories();
      const index = categories.findIndex(c => c.id === id);

      if (index === -1) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Categoría no encontrada' })
        };
      }

      const existing = categories[index];
      const updatedCat = {
        ...existing,
        name: name !== undefined ? name.trim().slice(0, 60) : existing.name,
        description: description !== undefined ? description.trim().slice(0, 160) : existing.description,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : existing.sortOrder,
        active: active !== undefined ? Boolean(active) : existing.active,
        updatedAt: new Date().toISOString()
      };

      categories[index] = updatedCat;
      await saveCategories(categories);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
          success: true,
          message: 'Categoría actualizada exitosamente',
          category: updatedCat
        })
      };
    } catch (error) {
      console.error('[admin-categories] PUT error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al actualizar la categoría' })
      };
    }
  }

  // DELETE: Delete category with dependency validation
  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Parámetro id requerido' })
      };
    }

    try {
      const [categories, products] = await Promise.all([
        getCategories(),
        getProducts()
      ]);

      const categoryExists = categories.some(c => c.id === id);
      if (!categoryExists) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Categoría no encontrada' })
        };
      }

      // Strict validation: cannot delete if products are linked
      const linkedProducts = (products || []).filter(p => p.categoryId === id);
      if (linkedProducts.length > 0) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Categoría con productos asociados',
            message: `No se puede eliminar la categoría porque contiene ${linkedProducts.length} producto(s) asignado(s). Primero debes reasignar o eliminar esos productos.`
          })
        };
      }

      const filtered = categories.filter(c => c.id !== id);
      await saveCategories(filtered);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
          success: true,
          message: 'Categoría eliminada exitosamente'
        })
      };
    } catch (error) {
      console.error('[admin-categories] DELETE error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al eliminar la categoría' })
      };
    }
  }

  return {
    statusCode: 405,
    headers: { 'Allow': 'GET, POST, PUT, DELETE', 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Método no permitido' })
  };
}
