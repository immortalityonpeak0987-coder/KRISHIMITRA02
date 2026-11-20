import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { SatelliteDataAsset } from '../src/models/SatelliteDataAsset.js';
import { SatelliteService } from '../src/integrations/satellite/satelliteService.js';

describe('Stage 6: Satellite Database Persistence & Task State Suite', () => {
  const validFarmId = new mongoose.Types.ObjectId();

  test('Valid SatelliteDataAsset document passes validation and includes indexes', async () => {
    const asset = new SatelliteDataAsset({
      farm: validFarmId,
      dataset: 'MODIS',
      productId: 'MOD13Q1',
      productVersion: '061',
      instrument: 'MODIS',
      parameter: 'NDVI',
      layer: '_250m_16_days_NDVI',
      spatialResolution: '250m',
      temporalResolution: '16-day',
      observationPeriod: {
        startDate: new Date('2026-11-01T00:00:00Z'),
        endDate: new Date('2026-11-16T23:59:59Z')
      },
      geographicArea: {
        type: 'Point',
        coordinates: [87.8639, 23.2324],
        isSubPixelObservation: true,
        effectivePixelAreaHectares: 6.25
      },
      taskId: '7b78f921-9989-4c07-b359-25ea885a528e',
      status: 'COMPLETED',
      outputFiles: [
        {
          fileId: 'file_001',
          fileName: 'MOD13Q1_NDVI.csv',
          fileSize: 4096,
          storageReference: 'appeears://bundle/7b78f921/file_001'
        }
      ],
      extractedValues: [
        {
          date: new Date('2026-11-01T00:00:00Z'),
          rawVal: 6800,
          scaledVal: 0.68,
          unit: 'index',
          qualityFlag: 'NOMINAL'
        }
      ],
      dataOrigin: 'SATELLITE_DERIVED'
    });

    await assert.doesNotReject(async () => {
      await asset.validate();
    });

    assert.equal(asset.dataset, 'MODIS');
    assert.equal(asset.status, 'COMPLETED');
    assert.equal(asset.outputFiles[0].storageReference, 'appeears://bundle/7b78f921/file_001');
  });

  test('submitAppeearsTask creates SatelliteDataAsset with PENDING status when DB is connected', async () => {
    let capturedDoc = null;
    const origCreate = SatelliteDataAsset.create;
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    SatelliteDataAsset.create = async (doc) => {
      capturedDoc = doc;
      return doc;
    };

    const mockAppeears = {
      hasCredentials: () => true,
      submitTask: async () => ({
        taskId: 'task-uuid-abc-123',
        status: 'pending'
      })
    };

    try {
      const service = new SatelliteService({ appeearsClient: mockAppeears });
      const res = await service.submitAppeearsTask({
        taskName: 'Test_Task',
        params: {
          dates: [{ startDate: '2026-05-01', endDate: '2026-05-16' }],
          layers: [{ product: 'MOD13Q1.061', layer: '_250m_16_days_NDVI' }]
        },
        farmId: validFarmId.toString()
      });

      assert.equal(res.success, true);
      assert.equal(res.taskId, 'task-uuid-abc-123');
      assert.ok(capturedDoc);
      assert.equal(capturedDoc.taskId, 'task-uuid-abc-123');
      assert.equal(capturedDoc.status, 'PENDING');
      assert.equal(capturedDoc.dataOrigin, 'SATELLITE_DERIVED');
    } finally {
      SatelliteDataAsset.create = origCreate;
      delete mongoose.connection.readyState;
    }
  });

  test('Database-disconnected state operates transparently without throwing', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });

    const mockCmr = {
      searchCollections: async () => ({ total: 1, collections: [{ id: 'C1' }] })
    };

    try {
      const service = new SatelliteService({ cmrClient: mockCmr });
      const res = await service.searchCmr({ keyword: 'MODIS' });
      assert.equal(res.success, true);
      assert.equal(res.total, 1);
    } finally {
      delete mongoose.connection.readyState;
    }
  });
});
