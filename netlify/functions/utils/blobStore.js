import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_SETTINGS, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_BLOB_DIR = path.resolve(__dirname, '../../../.local-blobs');

// Ensure local fallback directory exists
function ensureLocalDir(subDir = '') {
  const targetDir = path.join(LOCAL_BLOB_DIR, subDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

// Check if we are running in a real Netlify Blobs environment
function canUseNetlifyBlobs() {
  return Boolean(process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY);
}

// Generic get JSON helper with Netlify Blobs and local fallback
export async function getStoreJSON(storeName, key, defaultValue = null) {
  if (canUseNetlifyBlobs()) {
    try {
      const store = getStore({ name: storeName, consistency: 'strong' });
      const val = await store.get(key, { type: 'json' });
      if (val !== null && val !== undefined) return val;
    } catch (err) {
      console.warn(`[Blobs] Netlify Blobs read error on ${storeName}/${key}, trying fallback:`, err.message);
    }
  }

  // Local filesystem fallback
  try {
    const dir = ensureLocalDir(storeName);
    const filePath = path.join(dir, `${key}.json`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`[LocalBlobs] Read error for ${storeName}/${key}:`, err);
  }

  return defaultValue;
}

// Generic set JSON helper with Netlify Blobs and local fallback
export async function setStoreJSON(storeName, key, value) {
  let savedToBlobs = false;
  if (canUseNetlifyBlobs()) {
    try {
      const store = getStore({ name: storeName, consistency: 'strong' });
      await store.setJSON(key, value);
      savedToBlobs = true;
    } catch (err) {
      console.warn(`[Blobs] Netlify Blobs write error on ${storeName}/${key}:`, err.message);
    }
  }

  // Always keep local filesystem in sync when running locally or as backup
  try {
    const dir = ensureLocalDir(storeName);
    const filePath = path.join(dir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
  } catch (err) {
    console.error(`[LocalBlobs] Write error for ${storeName}/${key}:`, err);
    if (!savedToBlobs) throw err;
  }

  return true;
}

// Binary image retrieval
export async function getImageBlob(imageId) {
  if (canUseNetlifyBlobs()) {
    try {
      const store = getStore({ name: 'menu_images', consistency: 'strong' });
      const result = await store.getWithMetadata(imageId, { type: 'arrayBuffer' });
      if (result && result.data) {
        return {
          buffer: Buffer.from(result.data),
          contentType: result.metadata?.contentType || 'image/jpeg',
          size: result.metadata?.size || result.data.byteLength
        };
      }
    } catch (err) {
      console.warn(`[Blobs] Image fetch failed for ${imageId}:`, err.message);
    }
  }

  // Local fallback
  try {
    const dir = ensureLocalDir('menu_images');
    const binPath = path.join(dir, `${imageId}.bin`);
    const metaPath = path.join(dir, `${imageId}.meta.json`);

    if (fs.existsSync(binPath)) {
      const buffer = fs.readFileSync(binPath);
      let metadata = { contentType: 'image/jpeg', size: buffer.length };
      if (fs.existsSync(metaPath)) {
        metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      }
      return {
        buffer,
        contentType: metadata.contentType || 'image/jpeg',
        size: buffer.length
      };
    }
  } catch (err) {
    console.error(`[LocalBlobs] Image read error for ${imageId}:`, err);
  }

  return null;
}

// Binary image saving
export async function saveImageBlob(imageId, buffer, metadata = {}) {
  let savedToBlobs = false;
  const safeMeta = {
    contentType: metadata.contentType || 'image/jpeg',
    fileName: metadata.fileName || `${imageId}.jpg`,
    size: buffer.length,
    uploadedAt: new Date().toISOString()
  };

  if (canUseNetlifyBlobs()) {
    try {
      const store = getStore({ name: 'menu_images', consistency: 'strong' });
      await store.set(imageId, buffer, { metadata: safeMeta });
      savedToBlobs = true;
    } catch (err) {
      console.warn(`[Blobs] Image write failed for ${imageId}:`, err.message);
    }
  }

  // Local fallback
  try {
    const dir = ensureLocalDir('menu_images');
    const binPath = path.join(dir, `${imageId}.bin`);
    const metaPath = path.join(dir, `${imageId}.meta.json`);
    fs.writeFileSync(binPath, buffer);
    fs.writeFileSync(metaPath, JSON.stringify(safeMeta, null, 2), 'utf8');
  } catch (err) {
    console.error(`[LocalBlobs] Image write error for ${imageId}:`, err);
    if (!savedToBlobs) throw err;
  }

  return safeMeta;
}

// Binary image deletion
export async function deleteImageBlob(imageId) {
  if (canUseNetlifyBlobs()) {
    try {
      const store = getStore({ name: 'menu_images', consistency: 'strong' });
      await store.delete(imageId);
    } catch (err) {
      console.warn(`[Blobs] Image delete failed for ${imageId}:`, err.message);
    }
  }

  try {
    const dir = ensureLocalDir('menu_images');
    const binPath = path.join(dir, `${imageId}.bin`);
    const metaPath = path.join(dir, `${imageId}.meta.json`);
    if (fs.existsSync(binPath)) fs.unlinkSync(binPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  } catch (err) {
    console.error(`[LocalBlobs] Image delete error for ${imageId}:`, err);
  }

  return true;
}

// --- Specific Entities API ---

// 1. Restaurant Settings
export async function getRestaurantSettings() {
  const current = await getStoreJSON('restaurant_settings', 'config', null);
  if (!current) {
    // Seed initial settings
    await setStoreJSON('restaurant_settings', 'config', INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  }
  return current;
}

export async function updateRestaurantSettings(newSettings) {
  const existing = await getRestaurantSettings();
  const merged = {
    ...existing,
    ...newSettings,
    updatedAt: new Date().toISOString()
  };
  await setStoreJSON('restaurant_settings', 'config', merged);
  return merged;
}

// 2. Categories
export async function getCategories() {
  const current = await getStoreJSON('menu_categories', 'all', null);
  if (!current || !Array.isArray(current)) {
    // Seed initial categories
    await setStoreJSON('menu_categories', 'all', INITIAL_CATEGORIES);
    return INITIAL_CATEGORIES;
  }
  return current;
}

export async function saveCategories(categoriesList) {
  await setStoreJSON('menu_categories', 'all', categoriesList);
  return categoriesList;
}

// 3. Products
export async function getProducts() {
  const current = await getStoreJSON('menu_products', 'all', null);
  if (!current || !Array.isArray(current)) {
    // Seed initial products
    await setStoreJSON('menu_products', 'all', INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  }
  // Ensure backward compatibility if stored without new fields
  return current.map(p => {
    const initialMatch = INITIAL_PRODUCTS.find(ip => ip.id === p.id);
    return {
      ...p,
      ingredients: Array.isArray(p.ingredients) ? p.ingredients : (initialMatch?.ingredients || []),
      customizationMode: p.customizationMode || initialMatch?.customizationMode || (p.maxCombinations > 0 ? 'combine' : (p.ingredients?.length > 0 ? 'remove' : 'none')),
      maxCombinations: typeof p.maxCombinations === 'number' ? p.maxCombinations : (initialMatch?.maxCombinations || 0),
      minCombinations: typeof p.minCombinations === 'number' ? p.minCombinations : (initialMatch?.minCombinations || 0),
      combinationOptions: Array.isArray(p.combinationOptions) ? p.combinationOptions : (initialMatch?.combinationOptions || [])
    };
  });
}

export async function saveProducts(productsList) {
  await setStoreJSON('menu_products', 'all', productsList);
  return productsList;
}
