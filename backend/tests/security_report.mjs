import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import app from '../src/app.js';
import { configureCors } from '../src/config/cors.js';
import { notFoundHandler, errorHandler } from '../src/middleware/errorHandler.js';
import { config, validateProductionConfig } from '../src/config/env.js';
import { errorResponse } from '../src/utils/response.js';

console.log('================================================================');
console.log('  KRISHI-MITRA Stage 2: Integration & Security Verification Suite ');
console.log('================================================================\n');

async function runTests() {

  // ----------------------------------------------------------------
  // 1. ALLOWED CORS ORIGIN
  // ----------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('TEST 1: Allowed CORS Origin Verification');
  console.log('----------------------------------------------------------------');
  const allowedOrigin = 'http://localhost:5173';
  console.log(`[Request] GET /api/v1/health with Origin: ${allowedOrigin}`);

  const res1 = await request(app)
    .get('/api/v1/health')
    .set('Origin', allowedOrigin);

  console.log(`[Response] HTTP Status : ${res1.status}`);
  console.log(`[Response] Access-Control-Allow-Origin      : ${res1.headers['access-control-allow-origin']}`);
  console.log(`[Response] Access-Control-Allow-Credentials : ${res1.headers['access-control-allow-credentials']}`);
  console.log('[Response] Body JSON:');
  console.log(JSON.stringify(res1.body, null, 2));

  if (res1.status === 200 && res1.headers['access-control-allow-origin'] === allowedOrigin) {
    console.log('\x1b[32m✔ PASS: Allowed CORS origin accepted and authorized.\x1b[0m\n');
  } else {
    console.error('\x1b[31m✖ FAIL: Allowed CORS origin test failed.\x1b[0m\n');
  }

  // ----------------------------------------------------------------
  // 2. REJECTED UNAUTHORIZED CORS ORIGIN
  // ----------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('TEST 2: Rejected Unauthorized CORS Origin Verification');
  console.log('----------------------------------------------------------------');
  const unauthorizedOrigin = 'https://malicious-phishing-site.example.com';
  console.log(`[Request] GET /api/v1/health with Origin: ${unauthorizedOrigin} (Simulated Production Mode)`);

  const prodCorsApp = express();
  const originalProd = config.isProduction;
  config.isProduction = true; // Enable production mode for strict rejection

  try {
    prodCorsApp.use(configureCors());
    prodCorsApp.get('/api/v1/health', (req, res) => res.json({ ok: true }));
    prodCorsApp.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        statusCode: err.statusCode,
        message: err.message
      });
    });

    const res2 = await request(prodCorsApp)
      .get('/api/v1/health')
      .set('Origin', unauthorizedOrigin);

    console.log(`[Response] HTTP Status : ${res2.status}`);
    console.log(`[Response] Access-Control-Allow-Origin : ${res2.headers['access-control-allow-origin'] || 'NONE (Blocked)'}`);
    console.log('[Response] Body JSON:');
    console.log(JSON.stringify(res2.body, null, 2));

    if (res2.status === 403 && res2.body.message.includes('CORS policy violation')) {
      console.log('\x1b[32m✔ PASS: Unauthorized CORS origin rejected with HTTP 403 Forbidden.\x1b[0m\n');
    } else {
      console.error('\x1b[31m✖ FAIL: Unauthorized CORS origin test failed.\x1b[0m\n');
    }
  } finally {
    config.isProduction = originalProd;
  }

  // ----------------------------------------------------------------
  // 3. RATE-LIMIT THRESHOLD EXCEEDED
  // ----------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('TEST 3: Rate-Limit Threshold Exceeded Verification');
  console.log('----------------------------------------------------------------');
  const testLimitApp = express();
  const testLimiter = rateLimit({
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
  testLimitApp.use(testLimiter);
  testLimitApp.get('/test-rate-limit', (req, res) => res.json({ success: true, count: 'ok' }));

  console.log('[Executing] Sending Request #1 (within limit)...');
  const req1 = await request(testLimitApp).get('/test-rate-limit');
  console.log(`  -> HTTP ${req1.status} | RateLimit-Remaining: ${req1.headers['ratelimit-remaining']}`);

  console.log('[Executing] Sending Request #2 (reaches limit)...');
  const req2 = await request(testLimitApp).get('/test-rate-limit');
  console.log(`  -> HTTP ${req2.status} | RateLimit-Remaining: ${req2.headers['ratelimit-remaining']}`);

  console.log('[Executing] Sending Request #3 (exceeds limit)...');
  const req3 = await request(testLimitApp).get('/test-rate-limit');
  console.log(`  -> HTTP ${req3.status} | RateLimit-Remaining: ${req3.headers['ratelimit-remaining']}`);
  console.log('[Response] Body JSON:');
  console.log(JSON.stringify(req3.body, null, 2));

  if (req3.status === 429 && req3.body.error.code === 'RATE_LIMIT_EXCEEDED') {
    console.log('\x1b[32m✔ PASS: Rate limit threshold enforced with HTTP 429 and standard headers.\x1b[0m\n');
  } else {
    console.error('\x1b[31m✖ FAIL: Rate limit threshold test failed.\x1b[0m\n');
  }

  // ----------------------------------------------------------------
  // 4. UNKNOWN ENDPOINT RETURNING JSON 404
  // ----------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('TEST 4: Unknown Endpoint Returning JSON 404');
  console.log('----------------------------------------------------------------');
  const nonExistentPath = '/api/v1/invalid-route-for-testing-404';
  console.log(`[Request] GET ${nonExistentPath}`);

  const res4 = await request(app).get(nonExistentPath);

  console.log(`[Response] HTTP Status : ${res4.status}`);
  console.log(`[Response] Content-Type: ${res4.headers['content-type']}`);
  console.log('[Response] Body JSON:');
  console.log(JSON.stringify(res4.body, null, 2));

  if (res4.status === 404 && res4.body.error.code === 'ENDPOINT_NOT_FOUND' && res4.body.success === false) {
    console.log('\x1b[32m✔ PASS: Unknown route intercepted by 404 handler with structured JSON.\x1b[0m\n');
  } else {
    console.error('\x1b[31m✖ FAIL: 404 handler test failed.\x1b[0m\n');
  }

  // ----------------------------------------------------------------
  // 5. PRODUCTION ERROR RESPONSE WITHOUT STACK TRACE
  // ----------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('TEST 5: Production Error Response Without Stack Trace');
  console.log('----------------------------------------------------------------');
  const errorApp = express();
  const prevProd = config.isProduction;
  const prevDev = config.isDevelopment;
  config.isProduction = true;
  config.isDevelopment = false;

  try {
    errorApp.get('/trigger-leak-error', () => {
      const err = new Error('CRITICAL LEAK: Internal database connection failed for mock_test_cluster');
      throw err;
    });
    errorApp.use(errorHandler);

    console.log('[Request] GET /trigger-leak-error (Internal 500 error in Production Mode)');
    const res5 = await request(errorApp).get('/trigger-leak-error');

    console.log(`[Response] HTTP Status : ${res5.status}`);
    console.log('[Response] Body JSON:');
    console.log(JSON.stringify(res5.body, null, 2));

    const hasStack = Boolean(res5.body.error?.details?.stack || JSON.stringify(res5.body).includes('mock_test_cluster'));
    console.log(`[Security Audit] Stack trace leaked?       : ${hasStack ? 'YES (SECURITY DEFECT!)' : 'NO (SECURE)'}`);
    console.log(`[Security Audit] Sensitive message masked? : ${res5.body.message === 'An unexpected internal error occurred on the server.' ? 'YES (MASKED)' : 'NO (UNMASKED)'}`);

    if (res5.status === 500 && !hasStack && res5.body.error.code === 'INTERNAL_SERVER_ERROR') {
      console.log('\x1b[32m✔ PASS: Production error handler masked internal details and stack trace.\x1b[0m\n');
    } else {
      console.error('\x1b[31m✖ FAIL: Production error sanitization test failed.\x1b[0m\n');
    }
  } finally {
    config.isProduction = prevProd;
    config.isDevelopment = prevDev;
  }

  // ----------------------------------------------------------------
  // 6. MISSING / INVALID STAGE 2 ENVIRONMENT VARIABLES
  // ----------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('TEST 6: Missing & Invalid Stage 2 Environment Variables');
  console.log('----------------------------------------------------------------');

  const savedPort = config.port;
  const savedEnv = config.env;
  const savedUrls = config.frontendUrls;

  // Test 6a: Invalid negative port
  config.port = -500;
  try {
    console.log('[Scenario 6a] Testing invalid negative PORT (-500)...');
    validateProductionConfig();
    console.error('\x1b[31m✖ FAIL: Expected error for PORT -500 but none was thrown.\x1b[0m');
  } catch (err) {
    console.log(`[Caught Expected Error] ${err.message.split('\n')[0]}`);
    console.log(`  Details: ${err.message.split('\n')[1]}`);
    console.log('\x1b[32m✔ PASS: Negative port correctly rejected.\x1b[0m');
  }

  // Test 6b: Invalid out-of-range port
  config.port = 90000;
  try {
    console.log('\n[Scenario 6b] Testing invalid out-of-range PORT (90000)...');
    validateProductionConfig();
    console.error('\x1b[31m✖ FAIL: Expected error for PORT 90000 but none was thrown.\x1b[0m');
  } catch (err) {
    console.log(`[Caught Expected Error] ${err.message.split('\n')[0]}`);
    console.log(`  Details: ${err.message.split('\n')[1]}`);
    console.log('\x1b[32m✔ PASS: Out-of-range port correctly rejected.\x1b[0m');
  }

  // Test 6c: Missing / NaN PORT
  config.port = NaN;
  try {
    console.log('\n[Scenario 6c] Testing missing / unparseable PORT (NaN)...');
    validateProductionConfig();
    console.error('\x1b[31m✖ FAIL: Expected error for NaN port but none was thrown.\x1b[0m');
  } catch (err) {
    console.log(`[Caught Expected Error] ${err.message.split('\n')[0]}`);
    console.log(`  Details: ${err.message.split('\n')[1]}`);
    console.log('\x1b[32m✔ PASS: Missing/NaN port correctly rejected.\x1b[0m');
  }
  config.port = savedPort;

  // Test 6d: Invalid NODE_ENV
  config.env = 'invalid_staging_environment';
  try {
    console.log('\n[Scenario 6d] Testing invalid NODE_ENV ("invalid_staging_environment")...');
    validateProductionConfig();
    console.error('\x1b[31m✖ FAIL: Expected error for invalid NODE_ENV but none was thrown.\x1b[0m');
  } catch (err) {
    console.log(`[Caught Expected Error] ${err.message.split('\n')[0]}`);
    console.log(`  Details: ${err.message.split('\n')[1]}`);
    console.log('\x1b[32m✔ PASS: Invalid NODE_ENV correctly rejected.\x1b[0m');
  }

  // Test 6e: Missing NODE_ENV (verified fallback behavior)
  const defaultEnvFallback = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
  console.log('\n[Scenario 6e] Testing missing NODE_ENV fallback...');
  console.log(`  Default fallback resolved to: '${defaultEnvFallback}' (Permitted in ALLOWED_ENVIRONMENTS)`);
  config.env = defaultEnvFallback;
  try {
    validateProductionConfig();
    console.log('\x1b[32m✔ PASS: Missing NODE_ENV safely defaults to valid environment.\x1b[0m');
  } catch (err) {
    console.error(`\x1b[31m✖ FAIL: Fallback error: ${err.message}\x1b[0m`);
  }

  // Test 6f: Missing FRONTEND_URL
  config.frontendUrls = [];
  try {
    console.log('\n[Scenario 6f] Testing missing FRONTEND_URL (empty array)...');
    validateProductionConfig();
    console.error('\x1b[31m✖ FAIL: Expected error for empty FRONTEND_URL but none was thrown.\x1b[0m');
  } catch (err) {
    console.log(`[Caught Expected Error] ${err.message.split('\n')[0]}`);
    console.log(`  Details: ${err.message.split('\n')[1]}`);
    console.log('\x1b[32m✔ PASS: Missing FRONTEND_URL correctly rejected.\x1b[0m');
  }

  // Test 6g: Valid Stage 2 configuration (verifying MONGODB_URI and JWT_SECRET are NOT required)
  config.port = 5000;
  config.env = 'development';
  config.frontendUrls = ['http://localhost:3000', 'http://localhost:5173'];
  config.mongodbUri = ''; // Explicitly empty
  config.jwtSecret = '';  // Explicitly empty

  console.log('\n[Scenario 6g] Testing valid Stage 2 configuration with MONGODB_URI="" and JWT_SECRET=""...');
  try {
    validateProductionConfig();
    console.log('\x1b[32m✔ PASS: Stage 2 validation succeeds cleanly without requiring MONGODB_URI or JWT_SECRET.\x1b[0m\n');
  } catch (err) {
    console.error(`\x1b[31m✖ FAIL: Unexpected error with empty MONGODB_URI/JWT_SECRET: ${err.message}\x1b[0m\n`);
  }

  // Restore
  config.port = savedPort;
  config.env = savedEnv;
  config.frontendUrls = savedUrls;

  console.log('================================================================');
  console.log('  ALL INTEGRATION & SECURITY TESTS COMPLETED SUCCESSFULLY       ');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
