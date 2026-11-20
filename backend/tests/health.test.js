import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import app from '../src/app.js';
import { validateProductionConfig, config } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { configureCors } from '../src/config/cors.js';
import { errorResponse } from '../src/utils/response.js';
import rateLimit from 'express-rate-limit';

describe('Stage 2: KRISHI-MITRA Core Gateway & Health Endpoint Tests', () => {

  test('GET /: Root welcome endpoint returns 200 with documentation info', async () => {
    const res = await request(app)
      .get('/')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.match(res.body.message, /KRISHI-MITRA Backend Gateway/i);
    assert.ok(Array.isArray(res.body.data.healthCheckEndpoints));
  });

  test('GET /api/health: Legacy health check returns 200 with nominal liveness and database status', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'healthy');
    assert.equal(res.body.data.service, 'KRISHI-MITRA Backend API Gateway');
    assert.equal(res.body.data.version, '1.0.0');
    assert.ok(res.body.data.uptimeSeconds >= 0);
    assert.ok(res.body.data.timestamp);
    assert.ok(res.body.data.memoryUsageMB);
    // Stage 3 database status integration
    assert.ok(res.body.data.database, 'database block must exist in health payload');
    assert.ok(res.body.data.database.status, 'database.status must be reported');
    assert.equal(typeof res.body.data.database.isConnected, 'boolean');
  });

  test('GET /api/v1/health: Versioned health check returns equivalent payload (Dual-Mount Compatibility)', async () => {
    const [resLegacy, resV1] = await Promise.all([
      request(app).get('/api/health').expect(200),
      request(app).get('/api/v1/health').expect(200)
    ]);

    assert.equal(resV1.body.success, true);
    assert.equal(resV1.body.data.status, resLegacy.body.data.status);
    assert.equal(resV1.body.data.service, resLegacy.body.data.service);
    assert.equal(resV1.body.data.version, resLegacy.body.data.version);
    assert.deepEqual(resV1.body.data.routing.activePrefixes, ['/api', '/api/v1']);
    assert.equal(resV1.body.data.routing.compatibilityMode, 'Dual-Mount Legacy & Versioned');
    assert.deepEqual(resV1.body.data.database, resLegacy.body.data.database);
  });

  test('GET /api/ready & /api/v1/ready: Returns 503 Service Unavailable when database is disconnected', async () => {
    const [resLegacy, resV1] = await Promise.all([
      request(app).get('/api/ready').expect(503),
      request(app).get('/api/v1/ready').expect(503)
    ]);

    assert.equal(resLegacy.body.success, false);
    assert.equal(resLegacy.body.error.code, 'DATABASE_NOT_READY');
    assert.equal(resLegacy.body.error.details.database.isConnected, false);

    assert.equal(resV1.body.success, false);
    assert.equal(resV1.body.error.code, 'DATABASE_NOT_READY');
    assert.equal(resV1.body.error.details.database.isConnected, false);
  });

  test('Security Headers: Helmet sets protective headers', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-dns-prefetch-control'], 'off');
    assert.equal(res.headers['x-download-options'], 'noopen');
    assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
  });

  test('Rate Limiter: Standard RateLimit headers are attached', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    assert.ok(res.headers['ratelimit-limit'], 'RateLimit-Limit header should exist');
    assert.ok(res.headers['ratelimit-remaining'], 'RateLimit-Remaining header should exist');
  });

  test('Rate Limiter: Rejects requests with 429 when threshold is exceeded', async () => {
    const testApp = express();
    const thresholdLimiter = rateLimit({
      windowMs: 60000,
      max: 2,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        return errorResponse(res, {
          statusCode: 429,
          message: 'Too many requests. Please slow down and try again later.',
          errorCode: 'RATE_LIMIT_EXCEEDED',
          details: { windowMs: 60000, maxAllowed: 2 }
        });
      }
    });

    testApp.use(thresholdLimiter);
    testApp.get('/test-limit', (req, res) => res.json({ ok: true }));

    await request(testApp).get('/test-limit').expect(200);
    await request(testApp).get('/test-limit').expect(200);
    const res = await request(testApp).get('/test-limit').expect(429);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'RATE_LIMIT_EXCEEDED');
    assert.match(res.body.message, /Too many requests/i);
    assert.equal(res.body.error.details.maxAllowed, 2);
  });

  test('404 Handler: Unmapped endpoint returns standardized JSON error response', async () => {
    const res = await request(app)
      .get('/api/v1/non-existent-endpoint-test')
      .expect(404);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'ENDPOINT_NOT_FOUND');
    assert.match(res.body.message, /was not found on this server/i);
    assert.equal(res.body.error.details.path, '/api/v1/non-existent-endpoint-test');
  });

  test('CORS: Approved origins receive Access-Control-Allow-Origin header', async () => {
    const approvedOrigin = config.frontendUrls[0];
    const res = await request(app)
      .get('/api/health')
      .set('Origin', approvedOrigin)
      .expect(200);

    assert.equal(res.headers['access-control-allow-origin'], approvedOrigin);
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
  });

  test('CORS: Disallowed origins are rejected in strict production mode', async () => {
    // Create an isolated express app with strict production CORS
    const testApp = express();
    const strictCors = configureCors();
    
    // Temporarily mock isProduction
    const originalProd = config.isProduction;
    config.isProduction = true;

    try {
      testApp.use(strictCors);
      testApp.get('/test', (req, res) => res.json({ ok: true }));
      testApp.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
        res.status(err.statusCode || 500).json({ error: err.message });
      });

      const res = await request(testApp)
        .get('/test')
        .set('Origin', 'https://malicious-phishing-site.example.com')
        .expect(403);

      assert.match(res.body.error, /CORS policy violation/i);
    } finally {
      config.isProduction = originalProd;
    }
  });

  test('Centralized Error Handler: Masks internal error details and stack in production', async () => {
    const testApp = express();
    const originalProd = config.isProduction;
    const originalDev = config.isDevelopment;

    try {
      config.isProduction = true;
      config.isDevelopment = false;

      testApp.get('/error-trigger', () => {
        throw new Error('Database password / connection string leaked internally');
      });
      testApp.use(errorHandler);

      const res = await request(testApp)
        .get('/error-trigger')
        .expect(500);

      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'INTERNAL_SERVER_ERROR');
      // Verify internal error message and stack trace are sanitized in production
      assert.equal(res.body.message, 'An unexpected internal error occurred on the server.');
      assert.equal(res.body.error.details, undefined);
    } finally {
      config.isProduction = originalProd;
      config.isDevelopment = originalDev;
    }
  });

  test('Environment Validation: Validates Stage 2 settings and throws on invalid PORT, NODE_ENV, or missing FRONTEND_URL', () => {
    const originalPort = config.port;
    const originalEnv = config.env;
    const originalUrls = config.frontendUrls;

    try {
      // Test invalid negative PORT
      config.port = -1;
      assert.throws(() => {
        validateProductionConfig();
      }, /Invalid PORT configuration/);

      // Test invalid out-of-range PORT
      config.port = 99999;
      assert.throws(() => {
        validateProductionConfig();
      }, /Invalid PORT configuration/);
      config.port = originalPort;

      // Test invalid NODE_ENV
      config.env = 'invalid_environment';
      assert.throws(() => {
        validateProductionConfig();
      }, /Invalid NODE_ENV/);
      config.env = originalEnv;

      // Test missing FRONTEND_URL
      config.frontendUrls = [];
      assert.throws(() => {
        validateProductionConfig();
      }, /FRONTEND_URL must be specified/);
    } finally {
      config.port = originalPort;
      config.env = originalEnv;
      config.frontendUrls = originalUrls;
    }
  });

  test('Environment Validation: Passes when valid Stage 2 configuration is supplied (MONGODB_URI & JWT_SECRET optional)', () => {
    const originalMongo = config.mongodbUri;
    const originalJwt = config.jwtSecret;

    try {
      // Explicitly empty database and auth settings for Stage 2
      config.mongodbUri = '';
      config.jwtSecret = '';

      assert.doesNotThrow(() => {
        validateProductionConfig();
      });
    } finally {
      config.mongodbUri = originalMongo;
      config.jwtSecret = originalJwt;
    }
  });

});
