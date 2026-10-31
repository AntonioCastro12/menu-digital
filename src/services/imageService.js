// Client-side image compression and resizing using HTML5 Canvas
export async function compressAndResizeImage(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82
  } = options;

  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.match(/image\/(jpeg|png|webp)/i)) {
      reject(new Error('Formato no permitido. Solo se aceptan fotos JPG, PNG o WebP.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al decodificar la imagen'));
      img.onload = () => {
        let { width, height } = img;

        // Resize maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el lienzo para compresión'));
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP if supported, fallback to JPEG
        let dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve({
          dataUrl,
          width,
          height,
          originalSize: file.size,
          fileName: file.name
        });
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

// Upload processed image to server Netlify Blobs storage
export async function uploadImageToServer(dataUrl, fileName = 'foto.webp', authToken = null) {
  const token = authToken || localStorage.getItem('menu_admin_token');

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/.netlify/functions/admin-images', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      image: dataUrl,
      fileName
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error al subir la fotografía');
  }

  return data;
}

// Delete image from Netlify Blobs
export async function deleteImageFromServer(imageId, authToken = null) {
  if (!imageId) return;
  const token = authToken || localStorage.getItem('menu_admin_token');

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/.netlify/functions/admin-images?id=${encodeURIComponent(imageId)}`, {
    method: 'DELETE',
    headers,
    credentials: 'include'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error al eliminar la imagen');
  }

  return data;
}
