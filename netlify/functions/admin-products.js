import { requireAdmin } from './utils/auth.js';
import { getProducts, saveProducts, getCategories, deleteImageBlob } from './utils/blobStore.js';

export async function handler(event, context) {
  const auth = requireAdmin(event);
  if (!auth.authorized) {
    return auth.response;
  }

  // GET: List all products
  if (event.httpMethod === 'GET') {
    try {
      const [products, categories] = await Promise.all([
        getProducts(),
        getCategories()
      ]);

      const catMap = new Map((categories || []).map(c => [c.id, c.name]));

      const enriched = (products || []).map(p => ({
        ...p,
        categoryName: catMap.get(p.categoryId) || 'Sin categoría',
        ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
        customizationMode: p.customizationMode || (p.maxCombinations > 0 ? 'combine' : (p.ingredients?.length > 0 ? 'remove' : 'none')),
        maxCombinations: typeof p.maxCombinations === 'number' ? p.maxCombinations : 0,
        minCombinations: typeof p.minCombinations === 'number' ? p.minCombinations : 0,
        combinationOptions: Array.isArray(p.combinationOptions) ? p.combinationOptions : [],
        displayImageUrl: p.imageId
          ? `/.netlify/functions/menu-image?id=${p.imageId}`
          : (p.imageUrl || '')
      })).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify(enriched)
      };
    } catch (error) {
      console.error('[admin-products] GET error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al consultar productos' })
      };
    }
  }

  // Helper to validate product inputs
  const validateProductInput = (data, existingCategories) => {
    const errors = [];

    // Name validation
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('El nombre del producto es obligatorio');
    }

    // Price validation: must be a finite number >= 0
    const priceNum = Number(data.price);
    if (data.price === undefined || data.price === null || isNaN(priceNum) || priceNum < 0) {
      errors.push('El precio debe ser un número válido mayor o igual a 0');
    }

    // Category validation
    if (!data.categoryId || typeof data.categoryId !== 'string') {
      errors.push('La categoría del producto es obligatoria');
    } else if (existingCategories && !existingCategories.some(c => c.id === data.categoryId)) {
      errors.push('La categoría seleccionada no existe');
    }

    const custMode = ['none', 'remove', 'combine'].includes(data.customizationMode)
      ? data.customizationMode
      : (data.maxCombinations > 0 ? 'combine' : (data.ingredients?.length > 0 ? 'remove' : 'none'));
    const isCombine = custMode === 'combine';

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: {
        name: (data.name || '').trim().slice(0, 100),
        description: (data.description || '').trim().slice(0, 500),
        price: Math.round(priceNum * 100) / 100, // 2 decimal places
        categoryId: data.categoryId,
        imageId: data.imageId ? data.imageId.toString() : '',
        imageUrl: data.imageUrl ? data.imageUrl.toString() : '',
        available: data.available !== false,
        featured: Boolean(data.featured),
        promotion: Boolean(data.promotion),
        bestSeller: Boolean(data.bestSeller),
        isNew: Boolean(data.isNew),
        sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 1,
        customizationMode: custMode,
        maxCombinations: isCombine ? Math.max(0, parseInt(data.maxCombinations, 10) || 0) : 0,
        minCombinations: isCombine ? Math.max(0, parseInt(data.minCombinations, 10) || 0) : 0,
        combinationOptions: isCombine
          ? (Array.isArray(data.combinationOptions)
              ? data.combinationOptions.map(i => String(i).trim().slice(0, 50)).filter(Boolean)
              : (typeof data.combinationOptions === 'string'
                  ? data.combinationOptions.split(',').map(i => i.trim().slice(0, 50)).filter(Boolean)
                  : []))
          : [],
        ingredients: custMode === 'none'
          ? []
          : (Array.isArray(data.ingredients)
              ? data.ingredients.map(i => String(i).trim().slice(0, 50)).filter(Boolean)
              : (typeof data.ingredients === 'string'
                  ? data.ingredients.split(',').map(i => i.trim().slice(0, 50)).filter(Boolean)
                  : []))
      }
    };
  };

  // POST: Create product
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

    try {
      const [products, categories] = await Promise.all([
        getProducts(),
        getCategories()
      ]);

      const validation = validateProductInput(body, categories);
      if (!validation.isValid) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Datos del producto inválidos', details: validation.errors })
        };
      }

      const newId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const maxSortOrder = products.reduce((max, p) => Math.max(max, p.sortOrder || 0), 0);

      const newProduct = {
        id: newId,
        ...validation.sanitized,
        sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : maxSortOrder + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedList = [...products, newProduct];
      await saveProducts(updatedList);

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
          success: true,
          message: 'Producto creado exitosamente',
          product: {
            ...newProduct,
            displayImageUrl: newProduct.imageId
              ? `/.netlify/functions/menu-image?id=${newProduct.imageId}`
              : (newProduct.imageUrl || '')
          }
        })
      };
    } catch (error) {
      console.error('[admin-products] POST error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al crear el producto' })
      };
    }
  }

  // PUT: Update product
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

    const { id } = body;
    if (!id || typeof id !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ID de producto requerido' })
      };
    }

    try {
      const [products, categories] = await Promise.all([
        getProducts(),
        getCategories()
      ]);

      const index = products.findIndex(p => p.id === id);
      if (index === -1) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Producto no encontrado' })
        };
      }

      const existingProduct = products[index];
      const validation = validateProductInput({ ...existingProduct, ...body }, categories);

      if (!validation.isValid) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Datos inválidos', details: validation.errors })
        };
      }

      const oldImageId = existingProduct.imageId;
      const newImageId = validation.sanitized.imageId;

      const updatedProduct = {
        ...existingProduct,
        ...validation.sanitized,
        updatedAt: new Date().toISOString()
      };

      products[index] = updatedProduct;
      await saveProducts(products);

      // Safe orphan cleanup: if image was replaced, check if old image is still used elsewhere
      if (oldImageId && newImageId && oldImageId !== newImageId) {
        const stillUsed = products.some(p => p.imageId === oldImageId);
        if (!stillUsed) {
          deleteImageBlob(oldImageId).catch(err =>
            console.warn(`[admin-products] Warning cleaning replaced image ${oldImageId}:`, err.message)
          );
        }
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
          success: true,
          message: 'Producto actualizado exitosamente',
          product: {
            ...updatedProduct,
            displayImageUrl: updatedProduct.imageId
              ? `/.netlify/functions/menu-image?id=${updatedProduct.imageId}`
              : (updatedProduct.imageUrl || '')
          }
        })
      };
    } catch (error) {
      console.error('[admin-products] PUT error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al actualizar producto' })
      };
    }
  }

  // DELETE: Delete product
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
      const products = await getProducts();
      const productToDelete = products.find(p => p.id === id);

      if (!productToDelete) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Producto no encontrado' })
        };
      }

      const filtered = products.filter(p => p.id !== id);
      await saveProducts(filtered);

      // If product had an image, check if other products or restaurant settings use it before deleting
      if (productToDelete.imageId) {
        const imageInUse = filtered.some(p => p.imageId === productToDelete.imageId);
        if (!imageInUse) {
          deleteImageBlob(productToDelete.imageId).catch(err =>
            console.warn(`[admin-products] Warning cleaning deleted product image:`, err.message)
          );
        }
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
          success: true,
          message: 'Producto eliminado exitosamente'
        })
      };
    } catch (error) {
      console.error('[admin-products] DELETE error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al eliminar producto' })
      };
    }
  }

  return {
    statusCode: 405,
    headers: { 'Allow': 'GET, POST, PUT, DELETE', 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Método no permitido' })
  };
}
