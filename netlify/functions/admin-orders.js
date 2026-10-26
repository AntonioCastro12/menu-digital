import { requireAdmin } from './utils/auth.js';
import { getOrders, recordOrder, clearOrders, initBlobs } from './utils/blobStore.js';

export async function handler(event, context) {
  initBlobs(event);

  const auth = requireAdmin(event);
  if (!auth.authorized) {
    return auth.response;
  }

  // GET: Fetch sales analytics & order history
  if (event.httpMethod === 'GET') {
    try {
      const orders = await getOrders();

      const totalSales = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      const totalOrders = orders.length;
      const averageTicket = totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0;

      // Today's metrics (using UTC/Local date string comparison)
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayOrdersList = orders.filter(o => (o.createdAt || '').slice(0, 10) === todayStr);
      const todaySales = todayOrdersList.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      const todayOrdersCount = todayOrdersList.length;

      // Breakdown by order type
      const salesByMethod = {
        dineIn: { count: 0, total: 0, label: 'En Mesa' },
        takeout: { count: 0, total: 0, label: 'Para Llevar' },
        delivery: { count: 0, total: 0, label: 'A Domicilio' }
      };

      // Top selling products count & revenue
      const productStats = {};

      orders.forEach(ord => {
        const type = ord.orderType in salesByMethod ? ord.orderType : 'dineIn';
        salesByMethod[type].count += 1;
        salesByMethod[type].total += Number(ord.totalAmount) || 0;

        if (Array.isArray(ord.items)) {
          ord.items.forEach(it => {
            const pName = it.name || 'Sin nombre';
            const qty = Number(it.quantity) || 1;
            const rev = (Number(it.price) || 0) * qty;

            if (!productStats[pName]) {
              productStats[pName] = { name: pName, quantity: 0, revenue: 0 };
            }
            productStats[pName].quantity += qty;
            productStats[pName].revenue += rev;
          });
        }
      });

      // Sort top 5 products by quantity sold
      const topProducts = Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
          metrics: {
            totalSales,
            totalOrders,
            averageTicket,
            todaySales,
            todayOrdersCount,
            salesByMethod,
            topProducts
          },
          recentOrders: orders.slice(0, 20)
        })
      };
    } catch (err) {
      console.error('[admin-orders] Error calculating sales metrics:', err);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al calcular métricas de venta' })
      };
    }
  }

  // POST: Record manual sale (e.g. from cash register)
  if (event.httpMethod === 'POST') {
    try {
      const data = JSON.parse(event.body || '{}');
      if (!data.customerName || !data.totalAmount) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Cliente y monto total requeridos' })
        };
      }

      const recorded = await recordOrder(data);

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          order: recorded,
          message: 'Venta registrada con éxito'
        })
      };
    } catch (err) {
      console.error('[admin-orders] Error creating manual order:', err);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al registrar venta' })
      };
    }
  }

  // DELETE: Clear orders
  if (event.httpMethod === 'DELETE') {
    try {
      await clearOrders();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Historial de ventas reiniciado' })
      };
    } catch (err) {
      console.error('[admin-orders] Error clearing orders:', err);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al reiniciar ventas' })
      };
    }
  }

  return {
    statusCode: 405,
    headers: { 'Allow': 'GET, POST, DELETE', 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Método no permitido' })
  };
}
