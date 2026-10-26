import { getStore, connectLambda } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { INITIAL_SETTINGS, INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_ORDERS } from './seedData.js';

// Determine bundled storage directory safely across CommonJS, ESM and Lambda
function resolveBundledDir() {
  const cwdDir = path.resolve(process.cwd(), '.local-blobs');
  if (fs.existsSync(cwdDir)) return cwdDir;
  if (typeof __dirname !== 'undefined') {
    const relDir = path.resolve(__dirname, '../../../.local-blobs');
    if (fs.existsSync(relDir)) return relDir;
    const taskDir = path.resolve(__dirname, '.local-blobs');
    if (fs.existsSync(taskDir)) return taskDir;
  }
  return cwdDir;
}

// Bundled directory (read-only in AWS Lambda / Netlify, writable in local dev)
const BUNDLED_LOCAL_DIR = resolveBundledDir();

// Detect serverless environment
const isServerless = Boolean(
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NETLIFY
);

// In AWS Lambda, only /tmp is writable. In dev, project .local-blobs is writable.
const WRITABLE_LOCAL_DIR = isServerless
  ? path.join(os.tmpdir(), 'menu-local-blobs')
  : BUNDLED_LOCAL_DIR;

// Helper to initialize Netlify Blobs context in Lambda compatibility mode
export function initBlobs(event) {
  if (event && event.blobs) {
    try {
      connectLambda(event);
    } catch (err) {
      console.warn('[Blobs] connectLambda warning:', err.message);
    }
  }
}

// Safely obtain a Blobs store reference without throwing if Blobs is unconfigured
export function getStoreSafe(storeName) {
  try {
    return getStore({ name: storeName, consistency: 'strong' });
  } catch (err) {
    return null;
  }
}

// Ensure writable fallback directory exists
function ensureWritableDir(subDir = '') {
  try {
    const targetDir = path.join(WRITABLE_LOCAL_DIR, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return targetDir;
  } catch (err) {
    console.warn(`[Storage] Could not create fallback directory for ${subDir}:`, err.message);
    return null;
  }
}

// Generic get JSON helper with Netlify Blobs and safe local fallbacks
export async function getStoreJSON(storeName, key, defaultValue = null) {
  // 1. Try Netlify Blobs
  const store = getStoreSafe(storeName);
  if (store) {
    try {
      const val = await store.get(key, { type: 'json' });
      if (val !== null && val !== undefined) return val;
    } catch (err) {
      console.warn(`[Blobs] Netlify Blobs read error on ${storeName}/${key}, trying fallback:`, err.message);
    }
  }

  // 2. Try Writable fallback directory (/tmp or local)
  try {
    const writableFile = path.join(WRITABLE_LOCAL_DIR, storeName, `${key}.json`);
    if (fs.existsSync(writableFile)) {
      const raw = fs.readFileSync(writableFile, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[LocalBlobs] Writable dir read error for ${storeName}/${key}:`, err.message);
  }

  // 3. Try Bundled repository directory (.local-blobs)
  try {
    const bundledFile = path.join(BUNDLED_LOCAL_DIR, storeName, `${key}.json`);
    if (fs.existsSync(bundledFile)) {
      const raw = fs.readFileSync(bundledFile, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[LocalBlobs] Bundled dir read error for ${storeName}/${key}:`, err.message);
  }

  return defaultValue;
}

// Generic set JSON helper with Netlify Blobs and safe local fallback
export async function setStoreJSON(storeName, key, value) {
  let savedToBlobs = false;

  // 1. Try Netlify Blobs
  const store = getStoreSafe(storeName);
  if (store) {
    try {
      await store.setJSON(key, value);
      savedToBlobs = true;
    } catch (err) {
      console.warn(`[Blobs] Netlify Blobs write error on ${storeName}/${key}:`, err.message);
    }
  }

  // 2. Sync to writable local storage (safe, never crashes on EROFS)
  try {
    const dir = ensureWritableDir(storeName);
    if (dir) {
      const filePath = path.join(dir, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn(`[LocalBlobs] Write warning for ${storeName}/${key}:`, err.message);
  }

  return true;
}

// Binary image retrieval
export async function getImageBlob(imageId) {
  // 1. Try Netlify Blobs
  const store = getStoreSafe('menu_images');
  if (store) {
    try {
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

  // 2. Check Writable dir (/tmp or local)
  try {
    const binPath = path.join(WRITABLE_LOCAL_DIR, 'menu_images', `${imageId}.bin`);
    const metaPath = path.join(WRITABLE_LOCAL_DIR, 'menu_images', `${imageId}.meta.json`);
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
    console.warn(`[LocalBlobs] Image read error in writable dir for ${imageId}:`, err.message);
  }

  // 3. Check Bundled repository dir (.local-blobs)
  try {
    const binPath = path.join(BUNDLED_LOCAL_DIR, 'menu_images', `${imageId}.bin`);
    const metaPath = path.join(BUNDLED_LOCAL_DIR, 'menu_images', `${imageId}.meta.json`);
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
    console.warn(`[LocalBlobs] Image read error in bundled dir for ${imageId}:`, err.message);
  }

  return null;
}

// Binary image saving
export async function saveImageBlob(imageId, buffer, metadata = {}) {
  const safeMeta = {
    contentType: metadata.contentType || 'image/jpeg',
    fileName: metadata.fileName || `${imageId}.jpg`,
    size: buffer.length,
    uploadedAt: new Date().toISOString()
  };

  // 1. Try Netlify Blobs
  const store = getStoreSafe('menu_images');
  if (store) {
    try {
      await store.set(imageId, buffer, { metadata: safeMeta });
    } catch (err) {
      console.warn(`[Blobs] Image write failed for ${imageId}:`, err.message);
    }
  }

  // 2. Safe local writable fallback
  try {
    const dir = ensureWritableDir('menu_images');
    if (dir) {
      const binPath = path.join(dir, `${imageId}.bin`);
      const metaPath = path.join(dir, `${imageId}.meta.json`);
      fs.writeFileSync(binPath, buffer);
      fs.writeFileSync(metaPath, JSON.stringify(safeMeta, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn(`[LocalBlobs] Image write warning for ${imageId}:`, err.message);
  }

  return safeMeta;
}

// Binary image deletion
export async function deleteImageBlob(imageId) {
  // 1. Try Netlify Blobs
  const store = getStoreSafe('menu_images');
  if (store) {
    try {
      await store.delete(imageId);
    } catch (err) {
      console.warn(`[Blobs] Image delete failed for ${imageId}:`, err.message);
    }
  }

  // 2. Local fallback deletion
  try {
    const dir = ensureWritableDir('menu_images');
    if (dir) {
      const binPath = path.join(dir, `${imageId}.bin`);
      const metaPath = path.join(dir, `${imageId}.meta.json`);
      if (fs.existsSync(binPath)) fs.unlinkSync(binPath);
      if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    }
  } catch (err) {
    console.warn(`[LocalBlobs] Image delete warning for ${imageId}:`, err.message);
  }

  return true;
}

// --- Specific Entities API ---

// 1. Restaurant Settings
export async function getRestaurantSettings() {
  const current = await getStoreJSON('restaurant_settings', 'config', null);
  if (!current) {
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
    await setStoreJSON('menu_products', 'all', INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  }
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

// 4. Orders & Sales Metrics
export async function getOrders() {
  const current = await getStoreJSON('menu_orders', 'all', null);
  if (!current || !Array.isArray(current)) {
    await setStoreJSON('menu_orders', 'all', INITIAL_ORDERS);
    return INITIAL_ORDERS;
  }
  return current;
}

export async function recordOrder(orderInput) {
  const existingOrders = await getOrders();
  const newOrder = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    customerName: (orderInput.customerName || 'Cliente').trim().slice(0, 100),
    orderType: ['dineIn', 'takeout', 'delivery'].includes(orderInput.orderType)
      ? orderInput.orderType
      : 'dineIn',
    tableNumber: (orderInput.tableNumber || '').trim().slice(0, 50),
    deliveryAddress: (orderInput.deliveryAddress || '').trim().slice(0, 250),
    notes: (orderInput.notes || '').trim().slice(0, 300),
    items: Array.isArray(orderInput.items)
      ? orderInput.items.map(it => ({
          name: String(it.name || '').slice(0, 100),
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
          selectedCombinations: Array.isArray(it.selectedCombinations) ? it.selectedCombinations : [],
          excludedIngredients: Array.isArray(it.excludedIngredients) ? it.excludedIngredients : [],
          notes: (it.notes || '').slice(0, 200)
        }))
      : [],
    totalAmount: Math.max(0, Number(orderInput.totalAmount) || 0),
    itemCount: Array.isArray(orderInput.items)
      ? orderInput.items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0)
      : (Number(orderInput.itemCount) || 1),
    status: orderInput.status || 'completed',
    createdAt: new Date().toISOString()
  };

  const updatedOrders = [newOrder, ...existingOrders];
  await setStoreJSON('menu_orders', 'all', updatedOrders);
  return newOrder;
}

export async function clearOrders() {
  await setStoreJSON('menu_orders', 'all', []);
  return [];
}
