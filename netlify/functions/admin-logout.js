import { buildLogoutCookie } from './utils/auth.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  const cookieHeader = buildLogoutCookie();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader,
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    },
    body: JSON.stringify({
      success: true,
      message: 'Sesión cerrada correctamente'
    })
  };
}
