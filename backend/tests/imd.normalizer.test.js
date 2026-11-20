import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isImdMissingValue,
  parseImdNumber,
  parseImdDate,
  normalizeCurrentWeather,
  normalizeDistrictRainfall,
  normalizeStateRainfall,
  normalizeAwsData
} from '../src/integrations/imd/imd.normalizer.js';
import { IMD_STATUS } from '../src/integrations/imd/imd.constants.js';

describe('Stage 5: IMD Normalizer & Scientific Integrity Suite', () => {
  test('isImdMissingValue correctly identifies IMD missing fill representations', () => {
    assert.equal(isImdMissingValue(null), true);
    assert.equal(isImdMissingValue(undefined), true);
    assert.equal(isImdMissingValue(''), true);
    assert.equal(isImdMissingValue('NA'), true);
    assert.equal(isImdMissingValue('N/A'), true);
    assert.equal(isImdMissingValue('null'), true);
    assert.equal(isImdMissingValue('NaN'), true);
    assert.equal(isImdMissingValue(-999), true);
    assert.equal(isImdMissingValue(-99.9), true);
    assert.equal(isImdMissingValue(-99), true);
    assert.equal(isImdMissingValue('-999'), true);
    assert.equal(isImdMissingValue('-99.9'), true);

    // Genuine zeros are NEVER missing!
    assert.equal(isImdMissingValue(0), false);
    assert.equal(isImdMissingValue(0.0), false);
    assert.equal(isImdMissingValue('0'), false);
    assert.equal(isImdMissingValue('0.0'), false);
    assert.equal(isImdMissingValue(28.5), false);
    assert.equal(isImdMissingValue(-2.5), false);
  });

  test('parseImdNumber preserves genuine zeros and converts missing to null', () => {
    assert.equal(parseImdNumber(0), 0);
    assert.equal(parseImdNumber('0.0'), 0);
    assert.equal(parseImdNumber(25.4), 25.4);
    assert.equal(parseImdNumber('-999'), null);
    assert.equal(parseImdNumber('NA'), null);
    assert.equal(parseImdNumber(null), null);
  });

  test('parseImdDate correctly handles ISO, Indian DD-MM-YYYY, and Date inputs', () => {
    const fromIso = parseImdDate('2026-11-15T08:30:00Z');
    assert.equal(fromIso.isoDate, '2026-11-15');

    const fromIndianFormat = parseImdDate('15-11-2026 08:30:00');
    assert.equal(fromIndianFormat.isoDate, '2026-11-15');

    const fromDateObj = parseImdDate(new Date(Date.UTC(2026, 10, 15)));
    assert.equal(fromDateObj.isoDate, '2026-11-15');
  });

  test('normalizeCurrentWeather produces canonical parameters, OBSERVED origin, and handles zeros', () => {
    const rawPayload = [
      {
        station_id: '42809',
        station_name: 'Kolkata (Alipore)',
        temp: 32.5,
        rh: 68,
        wind_speed: 4.5,
        rainfall: 0.0,
        mslp: 1012.3,
        wind_direction: 180,
        observation_time: '2026-11-15 08:30:00'
      }
    ];

    const normalized = normalizeCurrentWeather(rawPayload, { stationId: '42809' });

    assert.equal(normalized.status, IMD_STATUS.SUCCESS);
    assert.equal(normalized.endpoint, '/current_wx');
    assert.equal(normalized.meta.source, 'IMD');
    assert.equal(normalized.meta.sourceProduct, 'IMD_CURRENT_WX');
    assert.equal(normalized.observations.length, 4);

    // Temperature
    const tempObs = normalized.observations.find(o => o.parameter === 'SURFACE_TEMPERATURE');
    assert.ok(tempObs);
    assert.equal(tempObs.value, 32.5);
    assert.equal(tempObs.unit, '°C');
    assert.equal(tempObs.dataOrigin, 'OBSERVED');
    assert.equal(tempObs.qualityFlag, 'NOMINAL');
    assert.equal(tempObs.stationId, '42809');
    assert.equal(tempObs.metadata.mslp_hpa, 1012.3);
    assert.equal(tempObs.metadata.windDirection_deg, 180);

    // Relative Humidity
    const rhObs = normalized.observations.find(o => o.parameter === 'RELATIVE_HUMIDITY');
    assert.ok(rhObs);
    assert.equal(rhObs.value, 68);
    assert.equal(rhObs.unit, '%');
    assert.equal(rhObs.dataOrigin, 'OBSERVED');

    // Wind Speed
    const windObs = normalized.observations.find(o => o.parameter === 'WIND_SPEED');
    assert.ok(windObs);
    assert.equal(windObs.value, 4.5);
    assert.equal(windObs.unit, 'm/s');

    // Rainfall Accumulation (0.0 genuine zero preserved)
    const rainObs = normalized.observations.find(o => o.parameter === 'RAINFALL_ACCUMULATION');
    assert.ok(rainObs);
    assert.equal(rainObs.value, 0.0);
    assert.equal(rainObs.unit, 'mm');
    assert.equal(rainObs.metadata.isZeroRainfall, true);
    assert.equal(rainObs.qualityFlag, 'NOMINAL');
  });

  test('normalizeCurrentWeather converts missing values (-999, NA) to null with MISSING qualityFlag', () => {
    const rawPayload = [
      {
        station_id: '42704',
        station_name: 'Burdwan',
        temp: -999,
        rh: 'NA',
        wind_speed: -99.9,
        rainfall: 'N/A'
      }
    ];

    const normalized = normalizeCurrentWeather(rawPayload);

    assert.equal(normalized.status, IMD_STATUS.NO_DATA_AVAILABLE);
    assert.equal(normalized.summary.availableObservations, 0);
    assert.equal(normalized.summary.missingObservations, 4);

    for (const obs of normalized.observations) {
      assert.equal(obs.value, null, 'Missing value must be normalized to null');
      assert.equal(obs.qualityFlag, 'MISSING');
      assert.equal(obs.dataOrigin, 'OBSERVED');
    }
  });

  test('normalizeDistrictRainfall maps actual, normal, departure, category, and OBSERVED origin', () => {
    const rawPayload = [
      {
        district: 'Purba Bardhaman',
        state: 'West Bengal',
        actual: 12.4,
        normal: 8.2,
        departure: 51.2,
        category: 'EXCESS',
        date: '2026-11-15'
      }
    ];

    const normalized = normalizeDistrictRainfall(rawPayload, { district: 'Purba Bardhaman' });

    assert.equal(normalized.status, IMD_STATUS.SUCCESS);
    assert.equal(normalized.meta.sourceProduct, 'IMD_DISTRICT_RAINFALL');
    assert.equal(normalized.observations.length, 1);

    const obs = normalized.observations[0];
    assert.equal(obs.parameter, 'RAINFALL_ACCUMULATION');
    assert.equal(obs.value, 12.4);
    assert.equal(obs.unit, 'mm');
    assert.equal(obs.spatialResolution, 'district');
    assert.equal(obs.temporalResolution, 'daily');
    assert.equal(obs.dataOrigin, 'OBSERVED');
    assert.equal(obs.metadata.normal_mm, 8.2);
    assert.equal(obs.metadata.departure_percent, 51.2);
    assert.equal(obs.metadata.category, 'EXCESS');
  });

  test('normalizeStateRainfall normalizes state aggregate observations and reporting stats', () => {
    const rawPayload = {
      state: 'West Bengal',
      actual: 9.8,
      normal: 10.1,
      departure: -3.0,
      category: 'NORMAL',
      reporting_districts: 22,
      total_districts: 23,
      date: '2026-11-15'
    };

    const normalized = normalizeStateRainfall(rawPayload);

    assert.equal(normalized.status, IMD_STATUS.SUCCESS);
    assert.equal(normalized.meta.sourceProduct, 'IMD_STATE_RAINFALL');
    assert.equal(normalized.observations.length, 1);

    const obs = normalized.observations[0];
    assert.equal(obs.parameter, 'RAINFALL_ACCUMULATION');
    assert.equal(obs.value, 9.8);
    assert.equal(obs.spatialResolution, 'state');
    assert.equal(obs.metadata.reportingDistricts, 22);
    assert.equal(obs.metadata.totalDistricts, 23);
  });

  test('normalizeAwsData normalizes AWS/ARG 15-minute telemetry and metadata', () => {
    const rawPayload = [
      {
        station_id: 'AWS_CANNING_01',
        station_name: 'Canning AWS',
        temp: 29.8,
        rh: 85,
        rainfall: 4.2,
        wind_speed: 6.1,
        wind_direction: 210,
        battery: 12.4,
        timestamp: '2026-11-15T08:15:00Z'
      }
    ];

    const normalized = normalizeAwsData(rawPayload);

    assert.equal(normalized.status, IMD_STATUS.SUCCESS);
    assert.equal(normalized.meta.sourceProduct, 'IMD_AWS_ARG');
    assert.equal(normalized.observations.length, 4);

    const rainObs = normalized.observations.find(o => o.parameter === 'RAINFALL_ACCUMULATION');
    assert.equal(rainObs.value, 4.2);
    assert.equal(rainObs.temporalResolution, '15-minute');
    assert.equal(rainObs.metadata.batteryVolts, 12.4);
  });
});
