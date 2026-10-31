import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'MiRestauranteSeguro2026!';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'menu_digital_super_secret_jwt_hmac_key_2026_xyz_!';
const SESSION_DURATION = parseInt(process.env.SESSION_DURATION_SECONDS || '86400', 10); // 24 hours

// In-memory brute force tracker (also resilient across warm lambdas)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Rate limit checker
export function checkRateLimit(clientIp) {
  const now = Date.now();
  const record = loginAttempts.get(clientIp);

  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  // If lockout window expired, reset
  if (now - record.firstAttempt > LOCKOUT_WINDOW_MS) {
    loginAttempts.delete(clientIp);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.firstAttempt + LOCKOUT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

export function recordFailedAttempt(clientIp) {
  const now = Date.now();
  const record = loginAttempts.get(clientIp) || { count: 0, firstAttempt: now };
  record.count += 1;
  loginAttempts.set(clientIp, record);
}

export function resetRateLimit(clientIp) {
  loginAttempts.delete(clientIp);
}

// Constant-time password verification to prevent timing attacks
export function verifyPassword(providedPassword) {
  if (!providedPassword || typeof providedPassword !== 'string') {
    return false;
  }

  const hashProvided = crypto.createHash('sha256').update(providedPassword).digest();
  const hashExpected = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();

  return crypto.timingSafeEqual(hashProvided, hashExpected);
}

// Generate signed session token (HMAC-SHA256)
export function createSessionToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    role: 'admin',
    iat: now,
    exp: now + SESSION_DURATION
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

// Verify session token
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [header, payload, signature] = parts;

  // Re-compute signature
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (data.exp && data.exp < now) {
      return false; // Expired
    }
    return data.role === 'admin';
  } catch {
    return false;
  }
}

// Extract token from request (Cookie or Bearer header)
export function extractToken(event) {
  // Check Authorization header
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Check Cookies
  const cookieHeader = event.headers?.cookie || event.headers?.Cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const c of cookies) {
      if (c.startsWith('admin_session=')) {
        return c.substring('admin_session='.length);
      }
    }
  }

  return null;
}

// Client IP resolver
export function getClientIp(event) {
  return (
    event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    event.headers?.['client-ip'] ||
    event.headers?.['x-real-ip'] ||
    '127.0.0.1'
  );
}

// Authorization middleware for functions
export function requireAdmin(event) {
  const token = extractToken(event);
  if (!token || !verifySessionToken(token)) {
    return {
      authorized: false,
      response: {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
          error: 'No autorizado',
          message: 'Debes iniciar sesión con credenciales de administrador para realizar esta acción.'
        })
      }
    };
  }

  return { authorized: true };
}

// Build secure Set-Cookie string
export function buildAuthCookie(token, isSecure = false) {
  const secureFlag = isSecure || process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION};${secureFlag}`;
}

export function buildLogoutCookie() {
  return 'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
}
