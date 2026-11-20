import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { configureCors } from './config/cors.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import nasaPowerRoutes from './routes/nasaPower.routes.js';
import imdRoutes from './routes/imd.routes.js';
import satelliteRoutes from './routes/satellite.routes.js';
import appeearsRoutes from './routes/appeears.routes.js';
import cmrRoutes from './routes/cmr.routes.js';
import earthEngineRoutes from './routes/earthEngine.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import environmentRoutes from './routes/environment.routes.js';
import riskRoutes from './routes/risk.routes.js';
import cropRoutes from './routes/crop.routes.js';
import reportRoutes from './routes/report.routes.js';
import farmRoutes from './routes/farm.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { successResponse } from './utils/response.js';

export function createApp() {
  const app = express();

  // 1. Trust Reverse Proxy (Render, Nginx, Cloudflare) for accurate client IP in rate limiting
  app.set('trust proxy', 1);

  // 2. Security Headers via Helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Managed per-frontend requirements
    crossOriginEmbedderPolicy: false
  }));

  // 3. CORS with Explicit Allowlist
  app.use(configureCors());

  // 4. Structured Request Logging (skipped in automated tests)
  if (!config.isTest) {
    const logFormat = config.isProduction ? 'combined' : 'dev';
    app.use(morgan(logFormat));
  }

  // 5. Body Parsing Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 6. Global Rate Limiter
  app.use(globalRateLimiter);

  // 7. Base Welcome Endpoint
  app.get('/', (req, res) => {
    return successResponse(res, {
      message: 'KRISHI-MITRA Backend Gateway — Smart Agriculture & Allied Sector Monitoring System',
      data: {
        documentation: '/docs',
        healthCheckEndpoints: ['/api/health', '/api/v1/health']
      }
    });
  });

  // 8. Dual-Mount Health Check Routes (Legacy /api and Versioned /api/v1)
  app.use('/api', healthRoutes);
  app.use('/api/v1', healthRoutes);

  // 9. NASA POWER Environmental Ingestion Endpoints (Dual-Mount Compatibility)
  app.use('/api/integrations/nasa-power', nasaPowerRoutes);
  app.use('/api/v1/integrations/nasa-power', nasaPowerRoutes);

  // 10. IMD Environmental Ingestion Endpoints (Dual-Mount Compatibility)
  app.use('/api/integrations/imd', imdRoutes);
  app.use('/api/v1/integrations/imd', imdRoutes);

  // 11. NASA Satellite Data Integration Endpoints (Dual-Mount Compatibility)
  app.use('/api/integrations/satellite', satelliteRoutes);
  app.use('/api/v1/integrations/satellite', satelliteRoutes);

  // 12. Dedicated NASA AppEEARS Endpoints (Dual-Mount Compatibility)
  app.use('/api/integrations/appeears', appeearsRoutes);
  app.use('/api/v1/integrations/appeears', appeearsRoutes);

  // 13. Dedicated NASA CMR Endpoints (Dual-Mount Compatibility)
  app.use('/api/integrations/cmr', cmrRoutes);
  app.use('/api/v1/integrations/cmr', cmrRoutes);

  // 14. Google Earth Engine REST Endpoints (Dual-Mount Compatibility)
  app.use('/api/integrations/earth-engine', earthEngineRoutes);
  app.use('/api/v1/integrations/earth-engine', earthEngineRoutes);

  // 12. Farm Profile & Observation Endpoints (Dual-Mount Compatibility)
  app.use('/api/farms', farmRoutes);
  app.use('/api/v1/farms', farmRoutes);

  // 13. Unified Analyses Endpoints (Matching Frontend /api/analyses/:farmId/*)
  app.use('/api/analyses', analysisRoutes);
  app.use('/api/v1/analyses', analysisRoutes);

  // 14. Environmental Standardization Endpoints
  app.use('/api/environment', environmentRoutes);
  app.use('/api/v1/environment', environmentRoutes);

  // 15. Agricultural Risk Assessment Endpoints
  app.use('/api/risks', riskRoutes);
  app.use('/api/v1/risks', riskRoutes);

  // 16. Crop Intelligence & Catalog Endpoints
  app.use('/api/crops', cropRoutes);
  app.use('/api/v1/crops', cropRoutes);

  // 17. Report Generation Endpoints
  app.use('/api/reports', reportRoutes);
  app.use('/api/v1/reports', reportRoutes);

  // 18. Kisan Sahayak Smart Advisory, Photo Diagnosis, Plan & Simulation Endpoints
  app.use('/api/ai', aiRoutes);
  app.use('/api/v1/ai', aiRoutes);

  // 19. 404 Not Found Handler for Unmapped Routes
  app.use(notFoundHandler);

  // 13. Centralized Error Handler (No stack leaks in production)
  app.use(errorHandler);

  return app;
}

export default createApp();
