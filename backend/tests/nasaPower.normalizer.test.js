import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isFillValue,
  normalizeNasaPowerResponse
} from '../src/integrations/nasaPower/nasaPower.normalizer.js';
import {
  NASA_POWER_PARAMETERS,
  INTEGRATION_STATUS
} from '../src/integrations/nasaPower/nasaPower.constants.js';

describe('Stage 4: NASA POWER Normalizer & Scientific Integrity Suite', () => {
  test('isFillValue correctly identifies NASA POWER -999 fill values', () => {
    assert.equal(isFillValue(-999), true, '-999 integer must be recognized as fill value');
    assert.equal(isFillValue(-999.0), true, '-999.0 float must be recognized as fill value');
    assert.equal(isFillValue('-999'), true, '"-999" string must be recognized as fill value');
    assert.equal(isFillValue(null), true, 'null is treated as missing');
    assert.equal(isFillValue(undefined), true, 'undefined is treated as missing');
    assert.equal(isFillValue(NaN), true, 'NaN is treated as missing');

    // Genuine measurements must NOT be treated as fill values
    assert.equal(isFillValue(0), false, '0 must NOT be treated as fill value');
    assert.equal(isFillValue(0.0), false, '0.0 must NOT be treated as fill value');
    assert.equal(isFillValue(-1.5), false, 'Negative temperature must NOT be treated as fill value');
    assert.equal(isFillValue(25.4), false, 'Positive temperature must NOT be treated as fill value');
  });

  test('Normalizes complete NASA POWER response with valid values, units, and resolutions', () => {
    const mockRawResponse = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [88.3639, 23.2324, 15.0]
      },
      properties: {
        parameter: {
          T2M: {
            '20261101': 24.5,
            '20261102': 23.8
          },
          T2M_MAX: {
            '20261101': 29.1,
            '20261102': 28.5
          },
          T2M_MIN: {
            '20261101': 19.2,
            '20261102': 18.9
          },
          PRECTOTCORR: {
            '20261101': 0.0,
            '20261102': 12.4
          },
          RH2M: {
            '20261101': 75.2,
            '20261102': 82.0
          },
          WS2M: {
            '20261101': 2.3,
            '20261102': 3.1
          },
          ALLSKY_SFC_SW_DWN: {
            '20261101': 18.5,
            '20261102': 16.2
          }
        }
      }
    };

    const requestMeta = {
      latitude: 23.2324,
      longitude: 88.3639,
      start: '20261101',
      end: '20261102',
      parameters: ['T2M', 'T2M_MAX', 'T2M_MIN', 'PRECTOTCORR', 'RH2M', 'WS2M', 'ALLSKY_SFC_SW_DWN']
    };

    const normalized = normalizeNasaPowerResponse(mockRawResponse, requestMeta);

    assert.equal(normalized.status, INTEGRATION_STATUS.SUCCESS);
    assert.equal(normalized.summary.totalDays, 2);
    assert.equal(normalized.summary.totalObservations, 14); // 7 params * 2 days
    assert.equal(normalized.summary.availableObservations, 14);
    assert.equal(normalized.summary.missingObservations, 0);

    // Verify grid coordinates, elevation, and explicit timeStandard retention
    assert.equal(normalized.meta.gridCoordinates.longitude, 88.3639);
    assert.equal(normalized.meta.gridCoordinates.latitude, 23.2324);
    assert.equal(normalized.meta.elevationMeters, 15.0);
    assert.equal(normalized.meta.timeStandard, 'UTC', 'Normalized meta must record explicit UTC time standard');

    // Verify preservation of genuine 0.0 mm rainfall
    assert.strictEqual(normalized.observationsByDate['2026-11-01'].PRECTOTCORR.value, 0.0);
    assert.strictEqual(normalized.observationsByDate['2026-11-01'].PRECTOTCORR.unit, 'mm/day');
    assert.strictEqual(normalized.observationsByDate['2026-11-01'].PRECTOTCORR.canonicalParameter, 'RAINFALL_ACCUMULATION');

    // Verify individual parameter resolutions and source models
    assert.strictEqual(normalized.observationsByDate['2026-11-01'].T2M.spatialResolution, '0.5° × 0.625°');
    assert.strictEqual(normalized.observationsByDate['2026-11-01'].T2M.sourceModel, 'MERRA-2');
    assert.strictEqual(normalized.observationsByDate['2026-11-01'].ALLSKY_SFC_SW_DWN.spatialResolution, '1.0° × 1.0°');
    assert.ok(
      normalized.observationsByDate['2026-11-01'].ALLSKY_SFC_SW_DWN.sourceModel.includes('CERES') ||
      normalized.observationsByDate['2026-11-01'].ALLSKY_SFC_SW_DWN.sourceModel.includes('SRB') ||
      normalized.observationsByDate['2026-11-01'].ALLSKY_SFC_SW_DWN.sourceModel.includes('FLASHFlux'),
      'Solar radiation must be attributed to solar satellite products (CERES/FLASHFlux/SRB)'
    );
    assert.equal(
      normalized.observationsByDate['2026-11-01'].ALLSKY_SFC_SW_DWN.sourceModel.includes('MERRA-2'),
      false,
      'Solar radiation must NOT be attributed to MERRA-2'
    );

    // Verify flat observation array contains Mongoose-ready structure with timeStandard
    const flatT2M = normalized.flatObservations.find(o => o.date === '2026-11-01' && o.rawParameter === 'T2M');
    assert.ok(flatT2M);
    assert.equal(flatT2M.parameter, 'SURFACE_TEMPERATURE');
    assert.equal(flatT2M.value, 24.5);
    assert.equal(flatT2M.unit, '°C');
    assert.equal(flatT2M.sourceName, 'NASA_POWER');
    assert.equal(flatT2M.sourceProduct, 'MERRA-2');
    assert.equal(flatT2M.dataOrigin, 'MODEL_ESTIMATE');
    assert.equal(flatT2M.qualityFlag, 'NOMINAL');
    assert.equal(flatT2M.metadata.timeStandard, 'UTC', 'Observation record metadata must retain UTC time standard');
    assert.equal(flatT2M.dateObj.toISOString().startsWith('2026-11-01'), true);
  });

  test('Maps -999 fill value to null and marks qualityFlag as MISSING', () => {
    const mockRawWithFills = {
      type: 'Feature',
      geometry: { coordinates: [88.0, 23.0] },
      properties: {
        parameter: {
          T2M: {
            '20261101': -999.0, // Missing fill value
            '20261102': 21.4
          },
          PRECTOTCORR: {
            '20261101': 0.0,
            '20261102': -999 // Missing fill value
          }
        }
      }
    };

    const requestMeta = {
      latitude: 23.0,
      longitude: 88.0,
      parameters: ['T2M', 'PRECTOTCORR']
    };

    const normalized = normalizeNasaPowerResponse(mockRawWithFills, requestMeta);

    assert.equal(normalized.status, INTEGRATION_STATUS.PARTIAL_DATA, 'Mixed missing data must report PARTIAL_DATA');
    assert.equal(normalized.summary.missingObservations, 2);
    assert.equal(normalized.summary.availableObservations, 2);

    // Verify -999 was converted to null, NOT 0
    assert.strictEqual(normalized.observationsByDate['2026-11-01'].T2M.value, null);
    assert.strictEqual(normalized.observationsByDate['2026-11-01'].T2M.qualityFlag, 'MISSING');

    assert.strictEqual(normalized.observationsByDate['2026-11-02'].PRECTOTCORR.value, null);
    assert.strictEqual(normalized.observationsByDate['2026-11-02'].PRECTOTCORR.qualityFlag, 'MISSING');

    // Confirm genuine 0.0 was preserved
    assert.strictEqual(normalized.observationsByDate['2026-11-01'].PRECTOTCORR.value, 0.0);
    assert.strictEqual(normalized.observationsByDate['2026-11-01'].PRECTOTCORR.qualityFlag, 'NOMINAL');
  });

  test('Preserves negative temperatures as genuine valid measurements', () => {
    const mockRawCold = {
      type: 'Feature',
      geometry: { coordinates: [88.2, 27.0] }, // Darjeeling / Himalayan region
      properties: {
        parameter: {
          T2M_MIN: {
            '20260115': -3.8 // Genuine sub-zero winter measurement
          }
        }
      }
    };

    const normalized = normalizeNasaPowerResponse(mockRawCold, {
      latitude: 27.0,
      longitude: 88.2,
      parameters: ['T2M_MIN']
    });

    assert.equal(normalized.status, INTEGRATION_STATUS.SUCCESS);
    assert.strictEqual(normalized.observationsByDate['2026-01-15'].T2M_MIN.value, -3.8);
    assert.strictEqual(normalized.observationsByDate['2026-01-15'].T2M_MIN.qualityFlag, 'NOMINAL');
  });

  test('Reports NO_DATA_AVAILABLE when all values are -999 fill values', () => {
    const mockRawAllFills = {
      type: 'Feature',
      geometry: { coordinates: [88.0, 23.0] },
      properties: {
        parameter: {
          T2M: {
            '20261101': -999.0,
            '20261102': -999.0
          }
        }
      }
    };

    const normalized = normalizeNasaPowerResponse(mockRawAllFills, {
      latitude: 23.0,
      longitude: 88.0,
      parameters: ['T2M']
    });

    assert.equal(normalized.status, INTEGRATION_STATUS.NO_DATA_AVAILABLE);
    assert.equal(normalized.summary.availableObservations, 0);
    assert.equal(normalized.summary.missingObservations, 2);
  });

  test('Rejects non-object or null input gracefully', () => {
    assert.throws(() => {
      normalizeNasaPowerResponse(null);
    }, /Cannot normalize invalid/);
  });
});
