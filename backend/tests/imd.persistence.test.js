import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ImdService } from '../src/integrations/imd/imd.service.js';
import { EnvironmentalObservation } from '../src/models/EnvironmentalObservation.js';
import { ApiCache } from '../src/models/ApiCache.js';

describe('Stage 5: IMD Database Persistence & Scientific Integrity Suite', () => {
  const validFarmId = new mongoose.Types.ObjectId().toString();

  test('persistObservations performs idempotent bulkWrite upsert', async () => {
    let capturedBulkOps = null;
    const origBulkWrite = EnvironmentalObservation.bulkWrite;

    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    EnvironmentalObservation.bulkWrite = async (ops) => {
      capturedBulkOps = ops;
      return { upsertedCount: ops.length, modifiedCount: 0 };
    };

    const mockObservations = [
      {
        date: '2026-11-15',
        dateObj: new Date('2026-11-15T00:00:00Z'),
        parameter: 'SURFACE_TEMPERATURE',
        value: 29.5,
        unit: '°C',
        sourceName: 'IMD',
        sourceProduct: 'IMD_CURRENT_WX',
        spatialResolution: 'station',
        temporalResolution: 'hourly',
        qualityFlag: 'NOMINAL',
        dataOrigin: 'OBSERVED',
        metadata: { stationId: '42809' }
      },
      {
        date: '2026-11-15',
        dateObj: new Date('2026-11-15T00:00:00Z'),
        parameter: 'RAINFALL_ACCUMULATION',
        value: 0.0,
        unit: 'mm',
        sourceName: 'IMD',
        sourceProduct: 'IMD_CURRENT_WX',
        spatialResolution: 'station',
        temporalResolution: 'hourly',
        qualityFlag: 'NOMINAL',
        dataOrigin: 'OBSERVED',
        metadata: { stationId: '42809', isZeroRainfall: true }
      }
    ];

    try {
      const service = new ImdService();
      const res = await service.persistObservations(validFarmId, mockObservations);

      assert.equal(res.skipped, false);
      assert.equal(res.persisted, 2);
      assert.ok(Array.isArray(capturedBulkOps));
      assert.equal(capturedBulkOps.length, 2);

      // Verify filter specifies farm, parameter, and observationDate
      const firstOp = capturedBulkOps[0].updateOne;
      assert.equal(firstOp.filter.farm.toString(), validFarmId);
      assert.equal(firstOp.filter.parameter, 'SURFACE_TEMPERATURE');
      assert.equal(firstOp.upsert, true);
      assert.equal(firstOp.update.$set.dataOrigin, 'OBSERVED');
      assert.equal(firstOp.update.$set.sourceName, 'IMD');

      // Verify genuine zero rainfall preserved
      const rainOp = capturedBulkOps[1].updateOne;
      assert.equal(rainOp.update.$set.value, 0.0);
      assert.equal(rainOp.update.$set.unit, 'mm');
    } finally {
      EnvironmentalObservation.bulkWrite = origBulkWrite;
      delete mongoose.connection.readyState;
    }
  });

  test('Missing values preserved as null, genuine zeros preserved as 0.0', async () => {
    let capturedBulkOps = null;
    const origBulkWrite = EnvironmentalObservation.bulkWrite;
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    EnvironmentalObservation.bulkWrite = async (ops) => {
      capturedBulkOps = ops;
      return { upsertedCount: ops.length, modifiedCount: 0 };
    };

    const mockObservations = [
      {
        date: '2026-11-15',
        dateObj: new Date('2026-11-15T00:00:00Z'),
        parameter: 'WIND_SPEED',
        value: null,
        unit: 'm/s',
        qualityFlag: 'MISSING',
        dataOrigin: 'OBSERVED',
        sourceName: 'IMD'
      },
      {
        date: '2026-11-15',
        dateObj: new Date('2026-11-15T00:00:00Z'),
        parameter: 'RAINFALL_ACCUMULATION',
        value: 0.0,
        unit: 'mm',
        qualityFlag: 'NOMINAL',
        dataOrigin: 'OBSERVED',
        sourceName: 'IMD'
      }
    ];

    try {
      const service = new ImdService();
      await service.persistObservations(validFarmId, mockObservations);

      assert.equal(capturedBulkOps[0].updateOne.update.$set.value, null);
      assert.equal(capturedBulkOps[0].updateOne.update.$set.qualityFlag, 'MISSING');

      assert.equal(capturedBulkOps[1].updateOne.update.$set.value, 0.0);
      assert.equal(capturedBulkOps[1].updateOne.update.$set.qualityFlag, 'NOMINAL');
    } finally {
      EnvironmentalObservation.bulkWrite = origBulkWrite;
      delete mongoose.connection.readyState;
    }
  });

  test('Database-disconnected state behaves transparently without throwing', async () => {
    // When readyState !== 1
    Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });

    const mockClient = {
      hasCredentials: () => true,
      getCurrentWeather: async () => [
        { station_id: '42809', temp: 30, rainfall: 0.0 }
      ]
    };

    try {
      const service = new ImdService({ client: mockClient });
      const res = await service.getCurrentWeather({
        stationId: '42809',
        farmId: validFarmId
      });

      assert.equal(res.success, true);
      assert.equal(res.fromCache, false);
      assert.ok(res.observations.length > 0);
    } finally {
      delete mongoose.connection.readyState;
    }
  });
});
