import { getImageBlob } from './utils/blobStore.js';

// SVG placeholder returned when image is missing or invalid
const PLACEHOLDER_SVG = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="#f5f5f4">
  <rect width="600" height="400" fill="#f5f5f4"/>
  <circle cx="300" cy="180" r="60" fill="#e7e5e4"/>
  <path d="M280 150h40v60h-40zM270 210h60v10h-60z" fill="#a8a29e"/>
  <text x="300" y="270" font-family="sans-serif" font-size="20" font-weight="600" fill="#78716c" text-anchor="middle">
    Fotografía no disponible
  </text>
</svg>
`).toString('base64');

export async function handler(event, context) {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'GET, HEAD' },
      body: 'Método no permitido'
    };
  }

  const imageId = event.queryStringParameters?.id;

  if (!imageId || typeof imageId !== 'string') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Parámetro id requerido' })
    };
  }

  try {
    const result = await getImageBlob(imageId);

    if (!result || !result.buffer) {
      // Fallback placeholder image
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=60', // short cache for fallback
          'Access-Control-Allow-Origin': '*'
        },
        isBase64Encoded: true,
        body: PLACEHOLDER_SVG
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': result.contentType || 'image/jpeg',
        // High-performance immutable cache since unique IDs are assigned per image upload
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': result.buffer.length.toString(),
        'Access-Control-Allow-Origin': '*'
      },
      isBase64Encoded: true,
      body: result.buffer.toString('base64')
    };
  } catch (error) {
    console.error(`[menu-image] Error serving image ${imageId}:`, error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error al recuperar la imagen' })
    };
  }
}
