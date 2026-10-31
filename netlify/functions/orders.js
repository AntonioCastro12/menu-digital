import { recordOrder, initBlobs } from './utils/blobStore.js';

export async function handler(event, context) {
  initBlobs(event);

  // POST: Record an order from WhatsApp checkout or customer cart
  if (event.httpMethod === 'POST') {
    try {
      const data = JSON.parse(event.body || '{}');

      if (!data.customerName || !data.items || !Array.isArray(data.items)) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Datos de pedido incompletos' })
        };
      }

      const recorded = await recordOrder(data);

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          orderId: recorded.id,
          totalAmount: recorded.totalAmount,
          message: 'Pedido registrado con éxito'
        })
      };
    } catch (err) {
      console.error('[orders] Error recording order:', err);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Error al registrar el pedido' })
      };
    }
  }

  return {
    statusCode: 405,
    headers: {
      'Allow': 'POST',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: 'Método no permitido' })
  };
}
