import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Farm } from '../src/models/Farm.js';
import { ApiCache } from '../src/models/ApiCache.js';
import { EnvironmentalObservation } from '../src/models/EnvironmentalObservation.js';
import { nasaPowerClient } from '../src/integrations/nasaPower/nasaPower.client.js';

describe('Stage 4: NASA POWER Routes & Dual-Mount Endpoint Suite', () => {
  const app = createApp();

  const validFarmId = new mongoose.Types.ObjectId().toString();
  const mockFarmDoc = {
    _id: validFarmId,
    farmName: 'Burdwan Test Farm',
    district: 'Purba Bardhaman',
    locationName: 'Galsi Village',
    coordinates: {
      latitude: 23.2324,
      longitude: 88.3639
    }
  };

  const mockDailyPayload = {
    type: 'Feature',
    geometry: { coordinates: [88.3639, 23.2324, 15.0] },
    properties: {
      parameter: {
        T2M: { '20240501': 35.2, '20240502': 36.1 },
        PRECTOTCORR: { '20240501': 0.0, '20240502': 2.5 }
      }
    }
  };

  test('GET /api/integrations/nasa-power/status returns 200 with operational metadata', async () => {
    const res = await request(app)
      .get('/api/integrations/nasa-power/status')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.provider, 'NASA POWER');
    assert.equal(res.body.data.status, 'OPERATIONAL');
    assert.equal(res.body.data.community, 'AG');
    assert.equal(res.body.data.timeStandard, 'UTC');
    assert.ok(res.body.data.supportedParameters.T2M);
  });

  test('GET /api/v1/integrations/nasa-power/status returns equivalent response (Dual-Mount Compatibility)', async () => {
    const res = await request(app)
      .get('/api/v1/integrations/nasa-power/status')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.provider, 'NASA POWER');
    assert.equal(res.body.data.status, 'OPERATIONAL');
    assert.equal(res.body.data.timeStandard, 'UTC');
  });

  test('GET /api/integrations/nasa-power/point returns 200 with normalized observations on valid query', async () => {
    const originalFetch = nasaPowerClient.fetchDailyPointData;
    nasaPowerClient.fetchDailyPointData = async () => mockDailyPayload;

    try {
      const res = await request(app)
        .get('/api/integrations/nasa-power/point')
        .query({
          latitude: 23.2324,
          longitude: 88.3639,
          startDate: '2024-05-01',
          endDate: '2024-05-02',
          parameters: 'T2M,PRECTOTCORR'
        })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.summary.totalDays, 2);
      assert.equal(res.body.data.meta.timeStandard, 'UTC');
      assert.strictEqual(res.body.data.observationsByDate['2024-05-01'].PRECTOTCORR.value, 0.0);
    } finally {
      nasaPowerClient.fetchDailyPointData = originalFetch;
    }
  });

  test('GET /api/v1/integrations/nasa-power/point returns 200 (Dual-Mount Compatibility)', async () => {
    const originalFetch = nasaPowerClient.fetchDailyPointData;
    nasaPowerClient.fetchDailyPointData = async () => mockDailyPayload;

    try {
      const res = await request(app)
        .get('/api/v1/integrations/nasa-power/point')
        .query({
          latitude: 23.2324,
          longitude: 88.3639,
          startDate: '2024-05-01',
          endDate: '2024-05-02'
        })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.summary.totalDays, 2);
    } finally {
      nasaPowerClient.fetchDailyPointData = originalFetch;
    }
  });

  test('GET /api/integrations/nasa-power/point returns 400 on invalid coordinates', async () => {
    const res = await request(app)
      .get('/api/integrations/nasa-power/point')
      .query({
        latitude: 99.5, // Invalid > 90
        longitude: 88.0,
        startDate: '2024-05-01',
        endDate: '2024-05-02'
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_COORDINATES');
    assert.ok(res.body.message.includes('outside the valid range'));
  });

  test('GET /api/v1/integrations/nasa-power/point returns 400 on invalid date order', async () => {
    const res = await request(app)
      .get('/api/v1/integrations/nasa-power/point')
      .query({
        latitude: 23.23,
        longitude: 88.36,
        startDate: '2024-05-10',
        endDate: '2024-05-01' // Before startDate
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_DATE_RANGE');
    assert.ok(res.body.message.includes('cannot be later than'));
  });

  test('GET /api/integrations/nasa-power/farms/:farmId returns 200 with farm metadata when DB is connected', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    const originalFindById = Farm.findById;
    const originalFindOne = ApiCache.findOne;
    const originalFindOneAndUpdate = ApiCache.findOneAndUpdate;
    const originalBulkWrite = EnvironmentalObservation.bulkWrite;
    const originalFetch = nasaPowerClient.fetchDailyPointData;

    Farm.findById = () => ({ lean: async () => mockFarmDoc });
    ApiCache.findOne = () => ({ lean: async () => null });
    ApiCache.findOneAndUpdate = async () => null;
    EnvironmentalObservation.bulkWrite = async () => ({ ok: 1 });
    nasaPowerClient.fetchDailyPointData = async () => mockDailyPayload;

    try {
      const res = await request(app)
        .get(`/api/integrations/nasa-power/farms/${validFarmId}`)
        .query({
          startDate: '2024-05-01',
          endDate: '2024-05-02'
        })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.meta.farm.id, validFarmId);
      assert.equal(res.body.meta.farm.farmName, 'Burdwan Test Farm');
      assert.equal(res.body.meta.farm.district, 'Purba Bardhaman');
      assert.equal(res.body.data.summary.totalDays, 2);
    } finally {
      delete mongoose.connection.readyState;
      Farm.findById = originalFindById;
      ApiCache.findOne = originalFindOne;
      ApiCache.findOneAndUpdate = originalFindOneAndUpdate;
      EnvironmentalObservation.bulkWrite = originalBulkWrite;
      nasaPowerClient.fetchDailyPointData = originalFetch;
    }
  });

  test('GET /api/v1/integrations/nasa-power/farms/:farmId returns 200 (Dual-Mount Compatibility)', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    const originalFindById = Farm.findById;
    const originalFindOne = ApiCache.findOne;
    const originalFindOneAndUpdate = ApiCache.findOneAndUpdate;
    const originalBulkWrite = EnvironmentalObservation.bulkWrite;
    const originalFetch = nasaPowerClient.fetchDailyPointData;

    Farm.findById = () => ({ lean: async () => mockFarmDoc });
    ApiCache.findOne = () => ({ lean: async () => null });
    ApiCache.findOneAndUpdate = async () => null;
    EnvironmentalObservation.bulkWrite = async () => ({ ok: 1 });
    nasaPowerClient.fetchDailyPointData = async () => mockDailyPayload;

    try {
      const res = await request(app)
        .get(`/api/v1/integrations/nasa-power/farms/${validFarmId}`)
        .query({
          startDate: '2024-05-01',
          endDate: '2024-05-02'
        })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.meta.farm.id, validFarmId);
    } finally {
      delete mongoose.connection.readyState;
      Farm.findById = originalFindById;
      ApiCache.findOne = originalFindOne;
      ApiCache.findOneAndUpdate = originalFindOneAndUpdate;
      EnvironmentalObservation.bulkWrite = originalBulkWrite;
      nasaPowerClient.fetchDailyPointData = originalFetch;
    }
  });

  test('GET /api/integrations/nasa-power/farms/:farmId returns 400 on invalid ObjectId format', async () => {
    const res = await request(app)
      .get('/api/integrations/nasa-power/farms/not-a-valid-hex-object-id')
      .query({
        startDate: '2024-05-01',
        endDate: '2024-05-02'
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('24-character hexadecimal'));
  });

  test('GET /api/v1/integrations/nasa-power/farms/:farmId returns 503 when database is disconnected', async () => {
    // When MongoDB is disconnected (readyState is 0), farm coordinates cannot be retrieved
    const validHexId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .get(`/api/v1/integrations/nasa-power/farms/${validHexId}`)
      .query({
        startDate: '2024-05-01',
        endDate: '2024-05-02'
      })
      .expect(503);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'DATABASE_UNAVAILABLE');
    assert.ok(res.body.message.includes('Database is currently disconnected'));
  });
});
