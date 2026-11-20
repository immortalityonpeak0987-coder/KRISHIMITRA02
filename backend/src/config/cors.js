import cors from 'cors';
import { config } from './env.js';

export function configureCors() {
  const allowedOrigins = config.frontendUrls;

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
      if (!origin) return callback(null, true);

      // Check if origin matches allowed origins or is a deployment domain on Vercel/Render/Cloud Run
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed === origin) return true;
        if (allowed.replace(/\/$/, '') === origin.replace(/\/$/, '')) return true;
        return false;
      }) || /\.(vercel\.app|onrender\.com|run\.app)$/i.test(origin) ||
         (process.env.VERCEL_URL && origin.includes(process.env.VERCEL_URL)) ||
         (process.env.APP_URL && origin.replace(/\/$/, '') === process.env.APP_URL.replace(/\/$/, ''));

      if (isAllowed || !config.isProduction) {
        callback(null, true);
      } else {
        const error = new Error(`CORS policy violation: Origin '${origin}' is not authorized.`);
        error.statusCode = 403;
        callback(error);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Session-Id', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['X-Guest-Session-Id', 'X-Total-Count', 'RateLimit-Limit', 'RateLimit-Remaining'],
    maxAge: 86400 // Cache preflight requests for 24 hours
  });
}
