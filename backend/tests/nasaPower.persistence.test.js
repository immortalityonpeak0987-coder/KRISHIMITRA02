import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { NasaPowerService } from '../src/integrations/nasaPower/nasaPower.service.js';
import { Farm } from '../src/models/Farm.js';
import { EnvironmentalObservation } from '../src/models/EnvironmentalObservation.js';
import { ApiCache } from '../src/models/ApiCache.js';
import { INTEGRATION_STATUS } from '../src/integrations/nasaPower/nasaPower.constants.js';

describe('Stage 4: NASA POWER Database Persistence & Farm Resolution Suite', () => {
  const testFarmId = new mongoose.Types.ObjectId().toString();
  const testFarmDocument = {
    _id: testFarmId,
    farmName: 'Burdwan Model Paddy Farm',
    district: 'Purba Bardhaman',
    locationName: 'Galsi Block II',
    coordinates: {
      latitude: 23.2324,
      longitude: 88.3639
    }
  };

  test('1. Valid Farm is retrieved by MongoDB ID and coordinates are resolved', async () => {
    let capturedFindId = null;
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    const originalFindById = Farm.findById;
    const originalFindOne = ApiCache.findOne;
    const originalFindOneAndUpdate = ApiCache.findOneAndUpdate;
    const originalBulkWrite = EnvironmentalObservation.bulkWrite;

    Farm.findById = (id) => {
      capturedFindId = String(id);
      return {
        lean: async () => testFarmDocument
      };
    };
    ApiCache.findOne = () => ({ lean: async () => null });
    ApiCache.findOneAndUpdate = async () => null;
    EnvironmentalObservation.bulkWrite = async () => ({ ok: 1 });

    const mockClient = {
      fetchDailyPointData: async () => ({
        type: 'Feature',
        geometry: { coordinates: [88.3639, 23.2324] },
        properties: { parameter: { T2M: { '20240501': 28.5 } } }
      })
    };

    try {
      const service = new NasaPowerService({ client: mockClient });
      const result = await service.getFarmData({
        farmId: testFarmId,
        startDate: '2024-05-01',
        endDate: '2024-05-01',
        parameters: ['T2M']
      });

      assert.equal(result.success, true);
      assert.equal(capturedFindId, testFarmId, 'Farm must be retrieved by exact MongoDB ObjectId');
      assert.equal(result.farm.id, testFarmId);
      assert.equal(result.farm.farmName, 'Burdwan Model Paddy Farm');
      assert.equal(result.farm.coordinates.latitude, 23.2324);
      assert.equal(result.farm.coordinates.longitude, 88.3639);
    } finally {
      delete mongoose.connection.readyState;
      Farm.findById = originalFindById;
      ApiCache.findOne = originalFindOne;
      ApiCache.findOneAndUpdate = originalFindOneAndUpdate;
      EnvironmentalObservation.bulkWrite = originalBulkWrite;
    }
  });

  test('2 & 3. EnvironmentalObservation documents are normalized and persisted via bulkWrite upsert', async () => {
    let capturedBulkOps = null;
    const originalBulkWrite = EnvironmentalObservation.bulkWrite;
    EnvironmentalObservation.bulkWrite = async (ops) => {
      capturedBulkOps = ops;
      return { ok: 1, upsertedCount: ops.length };
    };

    const service = new NasaPowerService();
    const flatObservations = [
      {
        date: '2024-05-01',
        dateObj: new Date('2024-05-01T00:00:00.000Z'),
        rawParameter: 'T2M',
        parameter: 'SURFACE_TEMPERATURE',
        value: 29.4,
        unit: '°C',
        qualityFlag: 'NOMINAL',
        sourceName: 'NASA_POWER',
        sourceProduct: 'MERRA-2',
        spatialResolution: '0.5° × 0.625°',
        temporalResolution: 'daily',
        dataOrigin: 'MODEL_ESTIMATE',
        metadata: { timeStandard: 'UTC' }
      }
    ];

    try {
      const status = await service.persistObservationsToFarm(testFarmId, flatObservations);

      assert.equal(status, 'PERSISTED_SUCCESS');
      assert.ok(capturedBulkOps, 'bulkWrite operations must be generated');
      assert.equal(capturedBulkOps.length, 1);

      const op = capturedBulkOps[0].updateOne;
      assert.equal(op.filter.farm, testFarmId);
      assert.equal(op.filter.parameter, 'SURFACE_TEMPERATURE');
      assert.equal(op.filter.observationDate.toISOString(), '2024-05-01T00:00:00.000Z');
      assert.equal(op.update.$set.value, 29.4);
      assert.equal(op.update.$set.unit, '°C');
      assert.equal(op.update.$set.sourceName, 'NASA_POWER');
      assert.equal(op.update.$set.dataOrigin, 'MODEL_ESTIMATE');
      assert.equal(op.upsert, true, 'Operations must be upserts to prevent duplicate records');
    } finally {
      EnvironmentalObservation.bulkWrite = originalBulkWrite;
    }
  });

  test('4. Repeated retrieval/persistence is strictly idempotent and does not create duplicate observations', async () => {
    const executedFilterSignatures = [];
    const originalBulkWrite = EnvironmentalObservation.bulkWrite;
    EnvironmentalObservation.bulkWrite = async (ops) => {
      for (const op of ops) {
        const sig = `${op.updateOne.filter.farm}:${op.updateOne.filter.parameter}:${op.updateOne.filter.observationDate.toISOString()}`;
        executedFilterSignatures.push(sig);
      }
      return { ok: 1, modifiedCount: ops.length };
    };

    const service = new NasaPowerService();
    const testObs = [
      {
        date: '2024-05-01',
        dateObj: new Date('2024-05-01T00:00:00.000Z'),
        rawParameter: 'PRECTOTCORR',
        parameter: 'RAINFALL_ACCUMULATION',
        value: 0.0,
        unit: 'mm/day',
        qualityFlag: 'NOMINAL',
        sourceName: 'NASA_POWER',
        sourceProduct: 'MERRA-2',
        spatialResolution: '0.5° × 0.625°',
        temporalResolution: 'daily',
        dataOrigin: 'MODEL_ESTIMATE',
        metadata: { timeStandard: 'UTC' }
      }
    ];

    try {
      // First persistence
      await service.persistObservationsToFarm(testFarmId, testObs);
      // Repeated identical persistence
      await service.persistObservationsToFarm(testFarmId, testObs);

      assert.equal(executedFilterSignatures.length, 2);
      // Both operations target the exact same composite key (farm + parameter + observationDate)
      assert.equal(executedFilterSignatures[0], executedFilterSignatures[1], 'Identical filters ensure in-place update without document duplication');
    } finally {
      EnvironmentalObservation.bulkWrite = originalBulkWrite;
    }
  });

  test('5 & 6. Missing values are preserved as null and genuine zeros are preserved as 0.0 in persistence payload', async () => {
    let capturedOps = null;
    const originalBulkWrite = EnvironmentalObservation.bulkWrite;
    EnvironmentalObservation.bulkWrite = async (ops) => {
      capturedOps = ops;
      return { ok: 1 };
    };

    const service = new NasaPowerService();
    const observations = [
      {
        date: '2024-05-01',
        dateObj: new Date('2024-05-01T00:00:00.000Z'),
        rawParameter: 'PRECTOTCORR',
        parameter: 'RAINFALL_ACCUMULATION',
        value: 0.0, // Genuine 0 mm rainfall
        unit: 'mm/day',
        qualityFlag: 'NOMINAL',
        sourceName: 'NASA_POWER',
        dataOrigin: 'MODEL_ESTIMATE',
        metadata: {}
      },
      {
        date: '2024-05-01',
        dateObj: new Date('2024-05-01T00:00:00.000Z'),
        rawParameter: 'T2M',
        parameter: 'SURFACE_TEMPERATURE',
        value: null, // Missing observation (from -999 fill value)
        unit: '°C',
        qualityFlag: 'MISSING',
        sourceName: 'NASA_POWER',
        dataOrigin: 'MODEL_ESTIMATE',
        metadata: { rawFillValueUsed: true }
      }
    ];

    try {
      await service.persistObservationsToFarm(testFarmId, observations);

      const rainfallOp = capturedOps.find(o => o.updateOne.filter.parameter === 'RAINFALL_ACCUMULATION');
      const tempOp = capturedOps.find(o => o.updateOne.filter.parameter === 'SURFACE_TEMPERATURE');

      // Assert genuine zero remains strictly 0, not coerced to null or false
      assert.strictEqual(rainfallOp.updateOne.update.$set.value, 0.0, 'Genuine zero must remain 0.0');
      assert.strictEqual(rainfallOp.updateOne.update.$set.qualityFlag, 'NOMINAL');

      // Assert missing value remains null, never coerced to 0
      assert.strictEqual(tempOp.updateOne.update.$set.value, null, 'Missing observation must remain null');
      assert.strictEqual(tempOp.updateOne.update.$set.qualityFlag, 'MISSING');
    } finally {
      EnvironmentalObservation.bulkWrite = originalBulkWrite;
    }
  });

  test('7. Database-disconnected request behaves transparently without throwing or crashing', async () => {
    // When mongoose.connection.readyState === 0 (disconnected)
    Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });

    const mockClient = {
      fetchDailyPointData: async ({ latitude, longitude }) => ({
        type: 'Feature',
        geometry: { coordinates: [longitude, latitude] },
        properties: { parameter: { T2M: { '20240501': 25.0 } } }
      })
    };

    try {
      const service = new NasaPowerService({ client: mockClient });

      // getFarmData must return 503 DATABASE_UNAVAILABLE when DB is disconnected
      const farmRes = await service.getFarmData({
        farmId: testFarmId,
        startDate: '2024-05-01',
        endDate: '2024-05-01'
      });
      assert.equal(farmRes.success, false);
      assert.equal(farmRes.statusCode, 503);
      assert.equal(farmRes.integrationStatus, INTEGRATION_STATUS.DATABASE_UNAVAILABLE);
      assert.ok(farmRes.error.includes('Database is currently disconnected'));

      // getPointData succeeds in returning normalized observations even if DB is disconnected
      const pointRes = await service.getPointData({
        latitude: 23.2324,
        longitude: 88.3639,
        startDate: '2024-05-01',
        endDate: '2024-05-01',
        parameters: ['T2M'],
        farmId: testFarmId
      });
      assert.equal(pointRes.success, true);
      assert.equal(pointRes.statusCode, 200);
      assert.equal(pointRes.persistenceStatus, 'SKIPPED_DB_DISCONNECTED', 'DB disconnection must be reported gracefully');
      assert.strictEqual(pointRes.data.observationsByDate['2024-05-01'].T2M.value, 25.0);
    } finally {
      delete mongoose.connection.readyState;
    }
  });
});
