import {
  verifyPassword,
  createSessionToken,
  buildAuthCookie,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  getClientIp,
  extractToken,
  verifySessionToken
} from './utils/auth.js';

export async function handler(event, context) {
  // Support GET to check if current session is still valid
  if (event.httpMethod === 'GET') {
    const token = extractToken(event);
    const isValid = token ? verifySessionToken(token) : false;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      },
      body: JSON.stringify({
        authenticated: isValid,
        message: isValid ? 'Sesión activa' : 'Sin sesión activa'
      })
    };
  }

  // Only POST for login
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'GET, POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  const clientIp = getClientIp(event);
  const rateLimitStatus = checkRateLimit(clientIp);

  if (!rateLimitStatus.allowed) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': (rateLimitStatus.retryAfterSeconds || 900).toString()
      },
      body: JSON.stringify({
        error: 'Demasiados intentos fallidos',
        message: `Has excedido el número máximo de intentos. Por favor espera ${Math.ceil(
          (rateLimitStatus.retryAfterSeconds || 900) / 60
        )} minutos antes de intentar de nuevo.`
      })
    };
  }

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

  const { password } = body;

  if (!password || typeof password !== 'string') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Contraseña o PIN requerido' })
    };
  }

  const isPasswordValid = verifyPassword(password);

  if (!isPasswordValid) {
    recordFailedAttempt(clientIp);
    const updatedStatus = checkRateLimit(clientIp);
    const remaining = updatedStatus.remaining ?? 0;

    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      },
      body: JSON.stringify({
        error: 'Credenciales inválidas',
        message: `Contraseña o PIN incorrecto. Intentos restantes antes de bloqueo temporal: ${remaining}`
      })
    };
  }

  // Successful login
  resetRateLimit(clientIp);
  const token = createSessionToken();
  const isHttps = event.headers?.['x-forwarded-proto'] === 'https';
  const cookieHeader = buildAuthCookie(token, isHttps);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader,
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    },
    body: JSON.stringify({
      success: true,
      message: 'Autenticación exitosa',
      token, // Dual authentication support (Cookie + Bearer header)
      expiresIn: 86400
    })
  };
}
