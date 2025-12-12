import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import https from 'https';
import http from 'http';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, 'dist')));

// Helper function to follow redirects server-side using native Node.js
const followRedirect = (url, method, headers, body, maxRedirects = 5) => {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Too many redirects'));
      return;
    }

    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        ...headers,
        host: urlObj.host,
      },
    };

    const req = client.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        followRedirect(redirectUrl, method, headers, body, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
      } else {
        // Collect response data
        let data = Buffer.alloc(0);
        res.on('data', (chunk) => {
          data = Buffer.concat([data, chunk]);
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, headers: res.headers, data });
        });
      }
    });

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
};

app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://api.follox.kz',
    changeOrigin: true,
    pathRewrite: { '^/api': '' }, // Remove /api prefix when forwarding
    selfHandleResponse: true, // Handle response manually to intercept redirects
    onProxyReq: (proxyReq, req, res) => {
      // Log proxy requests for debugging (optional, can remove in production)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.path}`);
      }
    },
    onProxyRes: async (proxyRes, req, res) => {
      // If it's a redirect, follow it server-side
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        const location = proxyRes.headers.location;
        
        // If redirect points to backend, follow it server-side
        if (location.includes('api.follox.kz')) {
          try {
            // Collect request body if present
            let requestBody = null;
            if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
              requestBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            }

            // Follow the redirect server-side
            const finalResponse = await followRedirect(
              location,
              req.method,
              {
                ...req.headers,
                'content-type': req.headers['content-type'] || 'application/json',
              },
              requestBody
            );

            // Send the final response to client
            Object.keys(finalResponse.headers).forEach((key) => {
              // Don't forward headers that expose backend
              const lowerKey = key.toLowerCase();
              if (!['x-powered-by', 'server', 'connection', 'transfer-encoding'].includes(lowerKey)) {
                // Rewrite any backend URLs in headers
                let headerValue = finalResponse.headers[key];
                if (typeof headerValue === 'string' && headerValue.includes('api.follox.kz')) {
                  headerValue = headerValue.replace(/https?:\/\/api\.follox\.kz/g, '/api');
                }
                res.setHeader(key, headerValue);
              }
            });
            res.status(finalResponse.statusCode);
            res.send(finalResponse.data);
            return;
          } catch (error) {
            console.error('[PROXY] Error following redirect:', error);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Proxy error following redirect' });
            }
            return;
          }
        } else {
          // External redirect - rewrite to use /api if it points to backend
          const rewrittenLocation = location.includes('api.follox.kz')
            ? location.replace(/https?:\/\/api\.follox\.kz/g, '/api')
            : location;
          res.status(proxyRes.statusCode);
          res.setHeader('Location', rewrittenLocation);
          res.end();
          return;
        }
      }

      // Not a redirect - forward response normally
      // Remove headers that might expose backend
      Object.keys(proxyRes.headers).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (!['x-powered-by', 'server', 'connection', 'transfer-encoding'].includes(lowerKey)) {
          // Rewrite any backend URLs in headers
          let headerValue = proxyRes.headers[key];
          if (typeof headerValue === 'string' && headerValue.includes('api.follox.kz')) {
            headerValue = headerValue.replace(/https?:\/\/api\.follox\.kz/g, '/api');
          }
          res.setHeader(key, headerValue);
        }
      });
      
      res.status(proxyRes.statusCode);
      proxyRes.pipe(res);
    },
    onError: (err, req, res) => {
      console.error('[PROXY] Error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Proxy error' });
      }
    },
  })
);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
