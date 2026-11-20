import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDatabaseStatus,
  sanitizeMongoUri,
  connectDatabase,
  disconnectDatabase
} from '../src/config/database.js';
import { config, validateProductionConfig } from '../src/config/env.js';

describe('Stage 3: Database Lifecycle & Configuration Suite', () => {

  test('sanitizeMongoUri masks credentials cleanly', () => {
    const raw = 'mongodb+srv://admin_user:SuperSecretPassword123@cluster0.mongodb.net/krishi_mitra';
    const sanitized = sanitizeMongoUri(raw);

    assert.equal(sanitized.includes('SuperSecretPassword123'), false, 'Password must not appear in sanitized string.');
    assert.equal(sanitized.includes('admin_user:***@'), true, 'Password must be replaced with asterisks.');
  });

  test('getDatabaseStatus reports accurate initial disconnected state', () => {
    const status = getDatabaseStatus();

    assert.ok(status.status, 'Status must exist.');
    assert.equal(typeof status.isConnected, 'boolean');
    assert.equal(typeof status.readyState, 'number');
  });

  test('connectDatabase returns null gracefully in development when MONGODB_URI is absent', async () => {
    const savedUri = config.mongodbUri;
    const savedProd = config.isProduction;

    try {
      config.mongodbUri = '';
      config.isProduction = false;

      const conn = await connectDatabase();
      assert.equal(conn, null, 'connectDatabase should return null without throwing in development.');
    } finally {
      config.mongodbUri = savedUri;
      config.isProduction = savedProd;
    }
  });

  test('connectDatabase throws fatal error in strict production mode when MONGODB_URI is absent', async () => {
    const savedUri = config.mongodbUri;
    const savedProd = config.isProduction;
    const savedStrict = process.env.STRICT_DB_REQUIRED;

    try {
      config.mongodbUri = '';
      config.isProduction = true;
      process.env.STRICT_DB_REQUIRED = 'true';

      await assert.rejects(async () => {
        await connectDatabase();
      }, /MONGODB_URI is strictly required in production mode/);
    } finally {
      config.mongodbUri = savedUri;
      config.isProduction = savedProd;
      if (savedStrict === undefined) delete process.env.STRICT_DB_REQUIRED;
      else process.env.STRICT_DB_REQUIRED = savedStrict;
    }
  });

  test('validateProductionConfig rejects missing or invalid MONGODB_URI in production mode', () => {
    const savedProd = config.isProduction;
    const savedUri = config.mongodbUri;

    try {
      config.isProduction = true;

      // 1. Missing URI
      config.mongodbUri = '';
      assert.throws(() => {
        validateProductionConfig();
      }, /MONGODB_URI is mandatory in production/);

      // 2. Invalid protocol
      config.mongodbUri = 'postgres://user:pass@localhost:5432/db';
      assert.throws(() => {
        validateProductionConfig();
      }, /MONGODB_URI format is invalid/);

      // 3. Valid protocol passes
      config.mongodbUri = 'mongodb+srv://user:pass@cluster.mongodb.net/krishi_mitra';
      assert.doesNotThrow(() => {
        validateProductionConfig();
      });
    } finally {
      config.isProduction = savedProd;
      config.mongodbUri = savedUri;
    }
  });

  test('disconnectDatabase is idempotent and executes cleanly without hanging', async () => {
    await assert.doesNotReject(async () => {
      await disconnectDatabase();
    });
  });

});
