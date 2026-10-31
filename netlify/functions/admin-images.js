import crypto from 'crypto';
import { requireAdmin } from './utils/auth.js';
import {
  saveImageBlob,
  deleteImageBlob,
  getProducts,
  getRestaurantSettings,
  initBlobs
} from './utils/blobStore.js';

// Allowed MIME types and magic bytes check
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB max limit for serverless payload

// Validate magic bytes for image safety
function validateImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 8) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export async function handler(event, context) {
  initBlobs(event);

  const auth = requireAdmin(event);
  if (!auth.authorized) {
    return auth.response;
  }

  // POST: Upload and persist image
  if (event.httpMethod === 'POST') {
    let rawBuffer = null;
    let declaredContentType = 'image/jpeg';
    let originalFileName = 'upload.jpg';

    try {
      let bodyData = {};
      try {
        bodyData = JSON.parse(event.body || '{}');
      } catch {
        bodyData = null;
      }

      if (bodyData && bodyData.image) {
        // Data URL format: "data:image/webp;base64,...."
        const matches = bodyData.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches) {
          declaredContentType = matches[1];
          rawBuffer = Buffer.from(matches[2], 'base64');
        } else {
          // Plain base64
          rawBuffer = Buffer.from(bodyData.image, 'base64');
        }
        if (bodyData.fileName) originalFileName = bodyData.fileName;
      } else if (event.isBase64Encoded && event.body) {
        rawBuffer = Buffer.from(event.body, 'base64');
        declaredContentType = event.headers['content-type'] || 'image/jpeg';
      } else {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'No se recibió ninguna imagen en la solicitud' })
        };
      }

      // 1. File size check
      if (rawBuffer.length > MAX_FILE_SIZE_BYTES) {
        return {
          statusCode: 413,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Archivo demasiado grande',
            message: `La imagen excede el límite permitido de 3 MB (recibido: ${(rawBuffer.length / (1024 * 1024)).toFixed(2)} MB)`
          })
        };
      }

      // 2. Real binary format validation (Magic bytes)
      const detectedMime = validateImageMagicBytes(rawBuffer);
      if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Formato no permitido',
            message: 'Solo se admiten fotografías en formato JPEG, PNG o WebP auténtico.'
          })
        };
      }

      // 3. Generate unique immutable ID
      const randomSuffix = crypto.randomBytes(6).toString('hex');
      const ext = detectedMime === 'image/webp' ? 'webp' : detectedMime === 'image/png' ? 'png' : 'jpg';
      const imageId = `img_${Date.now()}_${randomSuffix}`;

      // 4. Save to Netlify Blobs
      const meta = await saveImageBlob(imageId, rawBuffer, {
        contentType: detectedMime,
        fileName: `${imageId}.${ext}`,
        originalName: originalFileName
      });

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
          success: true,
          message: 'Fotografía guardada exitosamente en Netlify Blobs',
          imageId,
          url: `/.netlify/functions/menu-image?id=${imageId}`,
          size: meta.size,
          contentType: meta.contentType
        })
      };
    } catch (error) {
      console.error('[admin-images] Upload error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al procesar la imagen' })
      };
    }
  }

  // DELETE: Delete image safely (verify no dependencies)
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
      const [products, settings] = await Promise.all([
        getProducts(),
        getRestaurantSettings()
      ]);

      // Verify if image is used by any product
      const isUsedByProduct = (products || []).some(p => p.imageId === id);
      const isUsedBySettings = settings?.logoId === id || settings?.bannerId === id;

      if (isUsedByProduct || isUsedBySettings) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Imagen en uso',
            message: 'No se puede eliminar la fotografía porque está siendo utilizada por un producto o por el logotipo/portada del restaurante.'
          })
        };
      }

      await deleteImageBlob(id);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify({
          success: true,
          message: 'Fotografía eliminada exitosamente'
        })
      };
    } catch (error) {
      console.error('[admin-images] DELETE error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Error al eliminar la fotografía' })
      };
    }
  }

  return {
    statusCode: 405,
    headers: { 'Allow': 'POST, DELETE', 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Método no permitido' })
  };
}
