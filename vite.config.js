import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import url from 'url';

// Vite plugin to run Netlify Functions locally in 'npm run dev' without extra servers
function netlifyFunctionsDevPlugin() {
  const functionMap = {
    'menu': () => import('./netlify/functions/menu.js'),
    'menu-image': () => import('./netlify/functions/menu-image.js'),
    'admin-auth': () => import('./netlify/functions/admin-auth.js'),
    'admin-logout': () => import('./netlify/functions/admin-logout.js'),
    'admin-settings': () => import('./netlify/functions/admin-settings.js'),
    'admin-categories': () => import('./netlify/functions/admin-categories.js'),
    'admin-products': () => import('./netlify/functions/admin-products.js'),
    'admin-images': () => import('./netlify/functions/admin-images.js')
  };

  return {
    name: 'netlify-functions-dev-middleware',
    apply: 'serve', // Only active during 'vite' dev server, not during 'vite build'
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname || '';

        if (pathname.startsWith('/.netlify/functions/')) {
          const functionName = pathname.replace('/.netlify/functions/', '').split('?')[0];

          if (!functionMap[functionName]) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Function ${functionName} not found` }));
            return;
          }

          try {
            // Read body if method has one
            let rawBody = '';
            for await (const chunk of req) {
              rawBody += chunk;
            }

            // Create Netlify-compatible event object
            const event = {
              path: pathname,
              httpMethod: req.method,
              headers: req.headers,
              queryStringParameters: parsedUrl.query || {},
              body: rawBody || null,
              isBase64Encoded: false
            };

            const module = await functionMap[functionName]();
            const response = await module.handler(event, {});

            res.statusCode = response.statusCode || 200;
            if (response.headers) {
              for (const [key, val] of Object.entries(response.headers)) {
                res.setHeader(key, val);
              }
            }

            if (response.isBase64Encoded && response.body) {
              const buffer = Buffer.from(response.body, 'base64');
              res.end(buffer);
            } else {
              res.end(response.body || '');
            }
            return;
          } catch (err) {
            console.error(`[DevFunctionsMiddleware] Error executing ${functionName}:`, err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), netlifyFunctionsDevPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
