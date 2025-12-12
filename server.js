import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'dist')));

app.use(
    '/v1',
    createProxyMiddleware({
      target: 'https://api.follox.kz',
      changeOrigin: true,
      pathRewrite: { '^/v1': '' },
      followRedirects: true,
  
      onProxyRes(proxyRes, req, res) {
        // Prevent backend URLs from leaking on 30x redirects
        const location = proxyRes.headers['location'];
        if (location) {
          proxyRes.headers['location'] = location.replace('https://api.follox.kz', '/v1');
        }
      }
    })
  );

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
