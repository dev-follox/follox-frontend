import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'dist')));

app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://api.follox.kz',
    changeOrigin: true,
    pathRewrite: { '^/api': '' }, // Remove /api prefix when forwarding
    onProxyReq: (proxyReq, req, res) => {
      // Log proxy requests for debugging (optional, can remove in production)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.path}`);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Rewrite any redirects that point to the backend URL
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
        const location = proxyRes.headers.location;
        if (location && location.includes('api.follox.kz')) {
          // Rewrite redirect location to use /api prefix instead of backend URL
          proxyRes.headers.location = location.replace(/https?:\/\/api\.follox\.kz/g, '/api');
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[PROXY] Rewrote redirect: ${location} -> ${proxyRes.headers.location}`);
          }
        }
      }
      
      // Remove any headers that might expose the backend URL
      delete proxyRes.headers['x-powered-by'];
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
