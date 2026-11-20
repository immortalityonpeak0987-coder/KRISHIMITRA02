import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NasaPowerService,
  generateCacheKey
} from '../src/integrations/nasaPower/nasaPower.service.js';
import { INTEGRATION_STATUS } from '../src/integrations/nasaPower/nasaPower.constants.js';

describe('Stage 4: NASA POWER Service & Workflow Orchestration Suite', () => {
  test('generateCacheKey produces deterministic, sorted cache keys', () => {
    const key1 = generateCacheKey({
      latitude: 23.23241,
      longitude: 88.36391,
      start: '20261101',
      end: '20261105',
      parameters: ['WS2M', 'T2M', 'PRECTOTCORR']
    });

    const key2 = generateCacheKey({
      latitude: 23.2324,
      longitude: 88.3639,
      start: '20261101',
      end: '20261105',
      parameters: ['T2M', 'PRECTOTCORR', 'WS2M'] // Different order
    });

    assert.equal(key1, key2, 'Cache key must be deterministic and insensitive to parameter list ordering');
    assert.equal(key1, 'nasa_power_daily_23.2324_88.3639_20261101_20261105_PRECTOTCORR,T2M,WS2M');
  });

  test('Rejects invalid coordinates with 400 and INVALID_COORDINATES status', async () => {
    const service = new NasaPowerService();

    // Out of range latitude
    const res1 = await service.getPointData({
      latitude: 95.0,
      longitude: 88.0,
      startDate: '2026-11-01',
      endDate: '2026-11-02'
    });

    assert.equal(res1.success, false);
    assert.equal(res1.statusCode, 400);
    assert.equal(res1.integrationStatus, INTEGRATION_STATUS.INVALID_COORDINATES);
    assert.ok(res1.error.includes('-90 to 90'));

    // Non-numeric longitude
    const res2 = await service.getPointData({
      latitude: 23.0,
      longitude: 'not-a-number',
      startDate: '2026-11-01',
      endDate: '2026-11-02'
    });

    assert.equal(res2.success, false);
    assert.equal(res2.statusCode, 400);
    assert.equal(res2.integrationStatus, INTEGRATION_STATUS.INVALID_COORDINATES);
  });

  test('Rejects invalid date ranges with 400 and INVALID_DATE_RANGE status', async () => {
    const service = new NasaPowerService();

    // Missing start date
    const res1 = await service.getPointData({
      latitude: 23.0,
      longitude: 88.0,
      startDate: '',
      endDate: '2026-11-02'
    });
    assert.equal(res1.statusCode, 400);
    assert.equal(res1.integrationStatus, INTEGRATION_STATUS.INVALID_DATE_RANGE);

    // startDate later than endDate
    const res2 = await service.getPointData({
      latitude: 23.0,
      longitude: 88.0,
      startDate: '2026-11-10',
      endDate: '2026-11-01'
    });
    assert.equal(res2.statusCode, 400);
    assert.equal(res2.integrationStatus, INTEGRATION_STATUS.INVALID_DATE_RANGE);
    assert.ok(res2.error.includes('cannot be later than'));

    // Future date
    const res3 = await service.getPointData({
      latitude: 23.0,
      longitude: 88.0,
      startDate: '2099-01-01',
      endDate: '2099-01-05'
    });
    assert.equal(res3.statusCode, 400);
    assert.equal(res3.integrationStatus, INTEGRATION_STATUS.INVALID_DATE_RANGE);
    assert.ok(res3.error.includes('future dates'));
  });

  test('Rejects unsupported parameter names with 400 and UNSUPPORTED_PARAMETER status', async () => {
    const service = new NasaPowerService();

    const res = await service.getPointData({
      latitude: 23.0,
      longitude: 88.0,
      startDate: '2026-10-01',
      endDate: '2026-10-02',
      parameters: ['T2M', 'UNVERIFIED_FAKE_PARAM']
    });

    assert.equal(res.success, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.integrationStatus, INTEGRATION_STATUS.UNSUPPORTED_PARAMETER);
    assert.ok(res.error.includes('UNVERIFIED_FAKE_PARAM'));
  });

  test('Successfully coordinates client fetch and normalizer on valid point query', async () => {
    const mockClient = {
      fetchDailyPointData: async ({ latitude, longitude, start, end, parameters }) => ({
        type: 'Feature',
        geometry: { coordinates: [longitude, latitude, 12.0] },
        properties: {
          parameter: {
            T2M: { '20261001': 26.2, '20261002': 25.8 },
            PRECTOTCORR: { '20261001': 0.0, '20261002': 5.2 }
          }
        }
      })
    };

    const service = new NasaPowerService({ client: mockClient });
    const result = await service.getPointData({
      latitude: 23.2324,
      longitude: 88.3639,
      startDate: '2026-10-01',
      endDate: '2026-10-02',
      parameters: ['T2M', 'PRECTOTCORR']
    });

    assert.equal(result.success, true);
    assert.equal(result.statusCode, 200);
    assert.equal(result.integrationStatus, INTEGRATION_STATUS.SUCCESS);
    assert.equal(result.data.summary.totalDays, 2);
    assert.equal(result.data.summary.availableObservations, 4);
    assert.equal(result.data.observationsByDate['2026-10-01'].T2M.value, 26.2);
    assert.equal(result.data.observationsByDate['2026-10-01'].PRECTOTCORR.value, 0.0);
  });

  test('getFarmData rejects invalid farm ObjectId format', async () => {
    const service = new NasaPowerService();

    const result = await service.getFarmData({
      farmId: 'invalid-non-hex-id',
      startDate: '2026-10-01',
      endDate: '2026-10-02'
    });

    assert.equal(result.success, false);
    assert.equal(result.statusCode, 400);
    assert.ok(result.error.includes('24-character hexadecimal'));
  });

  test('getProviderStatus returns operational metadata, parameters, and disclaimers', () => {
    const service = new NasaPowerService();
    const status = service.getProviderStatus();

    assert.equal(status.provider, 'NASA POWER');
    assert.equal(status.status, 'OPERATIONAL');
    assert.equal(status.community, 'AG');
    assert.ok(status.supportedParameters.T2M);
    assert.ok(status.supportedParameters.PRECTOTCORR);
    assert.ok(status.supportedParameters.ALLSKY_SFC_SW_DWN);
    assert.ok(status.disclaimer.includes('gridded, model-derived'));
    assert.ok(Array.isArray(status.limitations));
  });
});
