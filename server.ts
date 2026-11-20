import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore - Express backend module
import backendApp from './backend/src/app.js';
// @ts-ignore - Express backend module
import { connectDatabase } from './backend/src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize backend database connection asynchronously (runs in disconnected mode if MONGODB_URI is not set)
  connectDatabase().catch((err: Error) => {
    console.warn('[KRISHI-MITRA Backend] Database notice:', err.message);
  });

  // Route all /api and /api/v1 requests directly to the Express backend
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return backendApp(req, res, next);
    }
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    // Vite is a development-only dependency; load it lazily so the
    // production runtime does not need dev dependencies installed.
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KRISHI-MITRA Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
