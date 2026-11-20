import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STANDARD_PARAMETERS,
  STANDARD_UNITS,
  QUALITY_STATES
} from '../src/services/environment/environmentalConstants.js';
import { EnvironmentalNormalizer } from '../src/services/environment/environmentalNormalizer.js';
import { EnvironmentalQualityService } from '../src/services/environment/environmentalQualityService.js';
import { EnvironmentalAggregationService } from '../src/services/environment/environmentalAggregationService.js';
import { EnvironmentalStandardizationService } from '../src/services/environment/environmentalStandardizationService.js';

describe('Module 1: Environmental Data Standardization Suite', () => {
  test('Resolves parameter aliases to canonical standard parameters', () => {
    assert.equal(EnvironmentalNormalizer.resolveParameter('T2M'), STANDARD_PARAMETERS.SURFACE_TEMPERATURE);
    assert.equal(EnvironmentalNormalizer.resolveParameter('PRECTOTCORR'), STANDARD_PARAMETERS.RAINFALL_ACCUMULATION);
    assert.equal(EnvironmentalNormalizer.resolveParameter('RH2M'), STANDARD_PARAMETERS.RELATIVE_HUMIDITY);
    assert.equal(EnvironmentalNormalizer.resolveParameter('WS2M'), STANDARD_PARAMETERS.WIND_SPEED);
    assert.equal(EnvironmentalNormalizer.resolveParameter('ALLSKY_SFC_SW_DWN'), STANDARD_PARAMETERS.SOLAR_RADIATION);
    assert.equal(EnvironmentalNormalizer.resolveParameter('_250m_16_days_NDVI'), STANDARD_PARAMETERS.NDVI);
    assert.equal(EnvironmentalNormalizer.resolveParameter('UNKNOWN_XYZ'), null);
  });

  test('Preserves original values, units, sources, and dataOrigin', () => {
    const raw = {
      parameter: 'T2M',
      value: 28.5,
      unit: '°C',
      sourceName: 'NASA_POWER',
      dataOrigin: 'MODEL_ESTIMATE',
      date: '2026-11-10T00:00:00Z'
    };
    const norm = EnvironmentalNormalizer.normalizeObservation(raw);

    assert.equal(norm.parameter, STANDARD_PARAMETERS.SURFACE_TEMPERATURE);
    assert.equal(norm.standardizedValue, 28.5);
    assert.equal(norm.standardizedUnit, '°C');
    assert.equal(norm.originalValue, 28.5);
    assert.equal(norm.source, 'NASA_POWER');
    assert.equal(norm.dataOrigin, 'MODEL_ESTIMATE');
    assert.equal(norm.qualityState, QUALITY_STATES.VALID);
  });

  test('Performs scientific unit conversions (km/h to m/s, Kelvin to Celsius)', () => {
    // Wind: 36 km/h -> 10 m/s
    const wind = EnvironmentalNormalizer.convertUnit(36, 'km/h', 'm/s', STANDARD_PARAMETERS.WIND_SPEED);
    assert.equal(wind, 10);

    // Temp: 300.15 K -> 27 °C
    const temp = EnvironmentalNormalizer.convertUnit(300.15, 'K', '°C', STANDARD_PARAMETERS.SURFACE_TEMPERATURE);
    assert.equal(temp, 27);
  });

  test('Preserves genuine physical 0.0 mm rainfall as valid measurement', () => {
    const raw = {
      parameter: 'PRECTOTCORR',
      value: 0.0,
      unit: 'mm',
      sourceName: 'GPM_IMERG',
      dataOrigin: 'SATELLITE_DERIVED'
    };
    const norm = EnvironmentalNormalizer.normalizeObservation(raw);

    assert.strictEqual(norm.standardizedValue, 0.0);
    assert.equal(norm.qualityState, QUALITY_STATES.VALID);
    assert.equal(norm.metadata.isZeroRainfall, true);
  });

  test('Maps upstream fill values (-999, -3000, <= -9990, NA) to null with MISSING quality state', () => {
    const fillNasa = EnvironmentalNormalizer.normalizeObservation({ parameter: 'T2M', value: -999 });
    assert.strictEqual(fillNasa.standardizedValue, null);
    assert.equal(fillNasa.qualityState, QUALITY_STATES.MISSING);

    const fillModis = EnvironmentalNormalizer.normalizeObservation({ parameter: 'NDVI', value: -3000 });
    assert.strictEqual(fillModis.standardizedValue, null);
    assert.equal(fillModis.qualityState, QUALITY_STATES.MISSING);

    const fillSmap = EnvironmentalNormalizer.normalizeObservation({ parameter: 'SOIL_MOISTURE', value: -9999.0 });
    assert.strictEqual(fillSmap.standardizedValue, null);
    assert.equal(fillSmap.qualityState, QUALITY_STATES.MISSING);

    const fillImd = EnvironmentalNormalizer.normalizeObservation({ parameter: 'RH', value: 'NA' });
    assert.strictEqual(fillImd.standardizedValue, null);
    assert.equal(fillImd.qualityState, QUALITY_STATES.MISSING);
  });

  test('Flags physically implausible readings as OUT_OF_RANGE', () => {
    const badRh = EnvironmentalNormalizer.normalizeObservation({
      parameter: 'RH2M',
      value: 145.0,
      unit: '%'
    });
    assert.equal(badRh.qualityState, QUALITY_STATES.OUT_OF_RANGE);
    assert.match(badRh.qualityDescription, /outside expected physical range/i);
  });

  test('Calculates spatial footprint and smallholder sub-pixel ratio', () => {
    // 1.5 hectare farm evaluated against 9km SMAP pixel (~8100 ha)
    const assessment = EnvironmentalQualityService.assessSpatialFootprint(1.5, '9km');
    assert.equal(assessment.isSubPixelObservation, true);
    assert.ok(assessment.ratio > 5000);
    assert.match(assessment.spatialWarning, /Coarse observation footprint/i);

    // 10 hectare farm evaluated against 30m HLS pixel (~0.09 ha)
    const hlsAssessment = EnvironmentalQualityService.assessSpatialFootprint(10.0, '30m');
    assert.equal(hlsAssessment.isSubPixelObservation, false);
    assert.equal(hlsAssessment.spatialWarning, null);
  });

  test('Aggregates multi-day time series with sums, means, and completeness tracking', () => {
    const observations = [
      EnvironmentalNormalizer.normalizeObservation({ parameter: 'PRECTOTCORR', value: 12.5, date: '2026-11-01' }),
      EnvironmentalNormalizer.normalizeObservation({ parameter: 'PRECTOTCORR', value: 0.0, date: '2026-11-02' }),
      EnvironmentalNormalizer.normalizeObservation({ parameter: 'PRECTOTCORR', value: 17.5, date: '2026-11-03' }),
      EnvironmentalNormalizer.normalizeObservation({ parameter: 'PRECTOTCORR', value: -999, date: '2026-11-04' }), // Missing
      EnvironmentalNormalizer.normalizeObservation({ parameter: 'T2M', value: 24.0, date: '2026-11-01' }),
      EnvironmentalNormalizer.normalizeObservation({ parameter: 'T2M', value: 26.0, date: '2026-11-02' })
    ];

    const agg = EnvironmentalAggregationService.aggregate(observations, {
      aggregation: 'weekly',
      expectedDays: 4
    });

    assert.equal(agg.totalObservations, 6);
    const rain = agg.metrics[STANDARD_PARAMETERS.RAINFALL_ACCUMULATION];
    assert.equal(rain.sum, 30.0);
    assert.equal(rain.validCount, 3);
    assert.equal(rain.missingCount, 1);
    assert.equal(rain.completenessPercent, 75); // 3 of 4 expected days

    const temp = agg.metrics[STANDARD_PARAMETERS.SURFACE_TEMPERATURE];
    assert.equal(temp.mean, 25.0);
    assert.equal(temp.min, 24.0);
    assert.equal(temp.max, 26.0);
  });

  test('EnvironmentalStandardizationService standardizes batch records cleanly', () => {
    const rawBatch = [
      { parameter: 'T2M', value: 22.4, sourceName: 'NASA_POWER' },
      { parameter: 'PRECTOTCORR', value: 4.2, sourceName: 'NASA_POWER' }
    ];
    const standardized = EnvironmentalStandardizationService.standardizeRecords(rawBatch);
    assert.equal(standardized.length, 2);
    assert.equal(standardized[0].parameter, STANDARD_PARAMETERS.SURFACE_TEMPERATURE);
    assert.equal(standardized[1].parameter, STANDARD_PARAMETERS.RAINFALL_ACCUMULATION);
  });
});
