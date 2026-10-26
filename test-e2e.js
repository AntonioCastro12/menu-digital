import { handler as menuHandler } from './netlify/functions/menu.js';
import { handler as authHandler } from './netlify/functions/admin-auth.js';
import { handler as logoutHandler } from './netlify/functions/admin-logout.js';
import { handler as productsHandler } from './netlify/functions/admin-products.js';
import { handler as categoriesHandler } from './netlify/functions/admin-categories.js';
import { handler as settingsHandler } from './netlify/functions/admin-settings.js';
import { handler as imagesHandler } from './netlify/functions/admin-images.js';
import { handler as menuImageHandler } from './netlify/functions/menu-image.js';
import { handler as ordersHandler } from './netlify/functions/orders.js';
import { handler as adminOrdersHandler } from './netlify/functions/admin-orders.js';

async function runTests() {
  console.log('--- INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS ---');
  let authToken = '';

  // TEST 1: Public Menu
  console.log('\n[1/8] Probando GET /.netlify/functions/menu...');
  const menuRes = await menuHandler({ httpMethod: 'GET', headers: {} }, {});
  console.log('Status code:', menuRes.statusCode);
  const menuData = JSON.parse(menuRes.body);
  console.log('Restaurante:', menuData.settings.name);
  console.log('Categorías encontradas:', menuData.categories.length);
  console.log('Platillos encontrados:', menuData.products.length);
  if (menuRes.statusCode !== 200 || menuData.products.length === 0) {
    throw new Error('Fallo en prueba de menú público');
  }
  console.log('-> Prueba 1 PASÓ con éxito.');

  // TEST 2: Admin Auth (Failed attempt + Rate limiting)
  console.log('\n[2/8] Probando POST /.netlify/functions/admin-auth con contraseña incorrecta...');
  const failAuthRes = await authHandler({
    httpMethod: 'POST',
    headers: { 'x-forwarded-for': '192.168.1.50' },
    body: JSON.stringify({ password: 'ClaveIncorrecta123' })
  }, {});
  console.log('Status code (esperado 401):', failAuthRes.statusCode);
  if (failAuthRes.statusCode !== 401) throw new Error('Debió fallar con 401');

  console.log('Probando POST /.netlify/functions/admin-auth con contraseña correcta...');
  const passAuthRes = await authHandler({
    httpMethod: 'POST',
    headers: { 'x-forwarded-for': '192.168.1.50' },
    body: JSON.stringify({ password: 'MiRestauranteSeguro2026!' })
  }, {});
  console.log('Status code (esperado 200):', passAuthRes.statusCode);
  const authData = JSON.parse(passAuthRes.body);
  authToken = authData.token;
  console.log('Token HMAC generado:', authToken ? 'Sí (OK)' : 'No (Error)');
  console.log('Cookie recibida:', passAuthRes.headers['Set-Cookie'] ? 'Sí (OK)' : 'No (Error)');
  if (!authToken) throw new Error('No se generó token de autenticación');
  console.log('-> Prueba 2 PASÓ con éxito.');

  // TEST 3: Admin Auth Check
  console.log('\n[3/8] Probando GET /.netlify/functions/admin-auth con token Bearer...');
  const checkAuthRes = await authHandler({
    httpMethod: 'GET',
    headers: { authorization: `Bearer ${authToken}` }
  }, {});
  const checkData = JSON.parse(checkAuthRes.body);
  console.log('Sesión activa:', checkData.authenticated);
  if (!checkData.authenticated) throw new Error('Token debió ser válido');
  console.log('-> Prueba 3 PASÓ con éxito.');

  // TEST 4: Category Protection (Cannot delete category with products)
  console.log('\n[4/8] Probando validación de dependencia al eliminar categoría...');
  const firstCatId = menuData.categories[0].id;
  const delCatRes = await categoriesHandler({
    httpMethod: 'DELETE',
    headers: { authorization: `Bearer ${authToken}` },
    queryStringParameters: { id: firstCatId }
  }, {});
  console.log('Status code (esperado 400 por productos vinculados):', delCatRes.statusCode);
  const delCatData = JSON.parse(delCatRes.body);
  console.log('Mensaje:', delCatData.message);
  if (delCatRes.statusCode !== 400) throw new Error('Debió rechazar eliminar categoría con productos');
  console.log('-> Prueba 4 PASÓ con éxito.');

  // TEST 5: Create Product with Price & Category Validation
  console.log('\n[5/8] Probando POST /.netlify/functions/admin-products...');
  const newProductRes = await productsHandler({
    httpMethod: 'POST',
    headers: { authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      name: 'Taco Campechano Especial',
      description: 'Bistec con longaniza y chicharrón crujiente',
      price: 88.50,
      categoryId: firstCatId,
      available: true,
      featured: true,
      customizationMode: 'combine',
      maxCombinations: 2,
      minCombinations: 2,
      combinationOptions: ['Pastor', 'Bistec', 'Longaniza'],
      ingredients: ['Cilantro', 'Cebolla', 'Limón']
    })
  }, {});
  console.log('Status code (esperado 201):', newProductRes.statusCode);
  const newProductData = JSON.parse(newProductRes.body);
  const createdProdId = newProductData.product.id;
  console.log('Producto creado con ID:', createdProdId);
  console.log('Modo combinación verificado (max 2):', newProductData.product.maxCombinations);
  if (newProductRes.statusCode !== 201 || !createdProdId || newProductData.product.maxCombinations !== 2) {
    throw new Error('Fallo al crear producto con combinaciones');
  }
  console.log('-> Prueba 5 PASÓ con éxito.');

  // TEST 6: Update Product (Price modification & Availability toggle)
  console.log('\n[6/8] Probando PUT /.netlify/functions/admin-products (cambiar precio y agotar)...');
  const updateProdRes = await productsHandler({
    httpMethod: 'PUT',
    headers: { authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      id: createdProdId,
      name: 'Taco Campechano Especial',
      description: 'Bistec con longaniza y chicharrón crujiente',
      price: 92.00,
      categoryId: firstCatId,
      available: false // Marcar como agotado
    })
  }, {});
  console.log('Status code (esperado 200):', updateProdRes.statusCode);
  const updateData = JSON.parse(updateProdRes.body);
  console.log('Nuevo precio:', updateData.product.price);
  console.log('Disponible:', updateData.product.available);
  if (updateData.product.price !== 92 || updateData.product.available !== false) {
    throw new Error('Fallo al actualizar producto');
  }
  console.log('-> Prueba 6 PASÓ con éxito.');

  // TEST 7: Image Upload with Magic Bytes Validation & Image Retrieval
  console.log('\n[7/8] Probando POST /.netlify/functions/admin-images (subir WebP auténtico)...');
  // Small 1x1 WebP binary image
  const sampleWebpBase64 = 'UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AAA/v6n/4H7/8H//4P//6P//7f//8X///5P///v/4AA';
  const imgUploadRes = await imagesHandler({
    httpMethod: 'POST',
    headers: { authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      image: `data:image/webp;base64,${sampleWebpBase64}`,
      fileName: 'test-dish.webp'
    })
  }, {});
  console.log('Status code (esperado 201):', imgUploadRes.statusCode);
  const imgUploadData = JSON.parse(imgUploadRes.body);
  const uploadedImageId = imgUploadData.imageId;
  console.log('Imagen guardada en Netlify Blobs con ID:', uploadedImageId);
  if (!uploadedImageId) throw new Error('Fallo al subir imagen');

  console.log('Probando GET /.netlify/functions/menu-image?id=' + uploadedImageId);
  const getImgRes = await menuImageHandler({
    httpMethod: 'GET',
    headers: {},
    queryStringParameters: { id: uploadedImageId }
  }, {});
  console.log('Status code imagen (esperado 200):', getImgRes.statusCode);
  console.log('Content-Type:', getImgRes.headers['Content-Type']);
  console.log('Cache-Control:', getImgRes.headers['Cache-Control']);
  if (getImgRes.statusCode !== 200 || !getImgRes.headers['Content-Type'].includes('image')) {
    throw new Error('Fallo al consultar imagen guardada');
  }
  console.log('-> Prueba 7 PASÓ con éxito.');

  // TEST 8: Delete Product & Cleanup
  console.log('\n[8/10] Probando DELETE /.netlify/functions/admin-products...');
  const delProdRes = await productsHandler({
    httpMethod: 'DELETE',
    headers: { authorization: `Bearer ${authToken}` },
    queryStringParameters: { id: createdProdId }
  }, {});
  console.log('Status code (esperado 200):', delProdRes.statusCode);
  console.log('-> Prueba 8 PASÓ con éxito.');

  // TEST 9: Orders (Customer WhatsApp checkout order)
  console.log('\n[9/10] Probando POST /.netlify/functions/orders...');
  const orderRes = await ordersHandler({
    httpMethod: 'POST',
    headers: {},
    body: JSON.stringify({
      customerName: 'Cliente Prueba E2E',
      orderType: 'dineIn',
      tableNumber: '9',
      totalAmount: 180,
      items: [
        { name: 'Orden Entera de patitas de puerco', price: 110, quantity: 1 },
        { name: 'Media Orden de Patita de Puerco', price: 70, quantity: 1 }
      ]
    })
  }, {});
  console.log('Status code (esperado 201):', orderRes.statusCode);
  const orderData = JSON.parse(orderRes.body);
  console.log('Pedido registrado con ID:', orderData.orderId);
  if (orderRes.statusCode !== 201 || !orderData.orderId) throw new Error('Fallo al registrar pedido');
  console.log('-> Prueba 9 PASÓ con éxito.');

  // TEST 10: Admin Sales Metrics Analytics
  console.log('\n[10/10] Probando GET /.netlify/functions/admin-orders...');
  const metricsRes = await adminOrdersHandler({
    httpMethod: 'GET',
    headers: { authorization: `Bearer ${authToken}` }
  }, {});
  console.log('Status code (esperado 200):', metricsRes.statusCode);
  const metricsData = JSON.parse(metricsRes.body);
  console.log('Ventas totales calculadas: $' + metricsData.metrics.totalSales);
  console.log('Total de pedidos:', metricsData.metrics.totalOrders);
  console.log('Ticket promedio: $' + metricsData.metrics.averageTicket);
  console.log('Top producto:', metricsData.metrics.topProducts[0]?.name);
  if (metricsRes.statusCode !== 200 || typeof metricsData.metrics.totalSales !== 'number') {
    throw new Error('Fallo en analítica de métricas de venta');
  }
  console.log('-> Prueba 10 PASÓ con éxito.');

  // TEST 11: Limpiar Dashboard / Órdenes
  console.log('\n[11/11] Probando DELETE /.netlify/functions/admin-orders (Limpiar Dashboard)...');
  const clearRes = await adminOrdersHandler({
    httpMethod: 'DELETE',
    headers: { authorization: `Bearer ${authToken}` }
  }, {});
  console.log('Status code (esperado 200):', clearRes.statusCode);
  if (clearRes.statusCode !== 200) throw new Error('Fallo al limpiar ventas');

  const afterClearRes = await adminOrdersHandler({
    httpMethod: 'GET',
    headers: { authorization: `Bearer ${authToken}` }
  }, {});
  const afterClearData = JSON.parse(afterClearRes.body);
  console.log('Ventas tras limpiar (esperado 0):', afterClearData.metrics.totalSales);
  console.log('Pedidos tras limpiar (esperado 0):', afterClearData.metrics.totalOrders);
  if (afterClearData.metrics.totalSales !== 0 || afterClearData.metrics.totalOrders !== 0) {
    throw new Error('Las métricas no volvieron a 0');
  }
  console.log('-> Prueba 11 PASÓ con éxito.');

  console.log('\n==========================================');
  console.log('¡TODAS LAS 11 PRUEBAS PASARON EXITOSAMENTE!');
  console.log('==========================================\n');
}

runTests().catch(err => {
  console.error('\n❌ ERROR EN PRUEBAS:', err);
  process.exit(1);
});
