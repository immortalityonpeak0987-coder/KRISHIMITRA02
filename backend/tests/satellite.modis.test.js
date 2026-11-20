import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ModisClient } from '../src/integrations/satellite/modisClient.js';
import { normalizeModisNdvi } from '../src/integrations/satellite/satelliteNormalizer.js';
import { SATELLITE_STATUS } from '../src/integrations/satellite/satelliteConfig.js';

describe('Stage 6: MODIS NDVI Scale Factor & Quality Suite', () => {
  const modis = new ModisClient();

  test('Applies official scale factor 0.0001 to raw integer NDVI', () => {
    const decoded = modis.decodeNdviValue(7250);
    assert.equal(decoded.rawVal, 7250);
    assert.equal(decoded.scaledVal, 0.725);
    assert.equal(decoded.unit, 'index');
    assert.equal(decoded.qualityFlag, 'NOMINAL');
  });

  test('Maps MODIS fill value -3000 to null with MISSING quality flag without coercing to zero', () => {
    const decoded = modis.decodeNdviValue(-3000);
    assert.equal(decoded.scaledVal, null);
    assert.equal(decoded.qualityFlag, 'MISSING');
  });

  test('Flags NDVI readings outside valid range [-0.2, 1.0] as SUSPECT', () => {
    const decodedHigh = modis.decodeNdviValue(12500); // Scaled = 1.25 > 1.0
    assert.equal(decodedHigh.qualityFlag, 'SUSPECT');

    const decodedLow = modis.decodeNdviValue(-3500); // Scaled = -0.35 < -0.2
    assert.equal(decodedLow.qualityFlag, 'SUSPECT');
  });

  test('Decodes MODIS 16-day VI Quality bitmask correctly', () => {
    // Value with bits 0-1 = 00 (Good data)
    const good = modis.decodeViQuality(0);
    assert.equal(good.modlandQa, 'GOOD_DATA');
    assert.equal(good.qualityAssessment, 'HIGH');

    // Value with bits 0-1 = 01 (Marginal data)
    const marginal = modis.decodeViQuality(1);
    assert.equal(marginal.modlandQa, 'MARGINAL_DATA');
    assert.equal(marginal.qualityAssessment, 'MODERATE');

    // Value with bits 0-1 = 11 (Cloudy/missing)
    const cloudy = modis.decodeViQuality(3);
    assert.equal(cloudy.modlandQa, 'CLOUDY_OR_MISSING');
    assert.equal(cloudy.qualityAssessment, 'POOR');
  });

  test('normalizeModisNdvi sets 250m resolution and evaluates farm sub-pixel ratio', () => {
    const rawData = [
      { observationDate: '2026-11-01', rawVal: 6500, viQuality: 0 },
      { observationDate: '2026-11-17', rawVal: -3000 }
    ];

    const result = normalizeModisNdvi(rawData, { farmAreaHectares: 1.25 });
    assert.equal(result.status, SATELLITE_STATUS.SUCCESS);
    assert.equal(result.dataset, 'MODIS');
    assert.equal(result.product, 'MOD13Q1.061');
    assert.equal(result.observations.length, 2);

    const obs1 = result.observations[0];
    assert.equal(obs1.parameter, 'NDVI');
    assert.equal(obs1.value, 0.65);
    assert.equal(obs1.qualityFlag, 'NOMINAL');
    assert.equal(obs1.metadata.qualityAssessment.modlandQa, 'GOOD_DATA');

    const obs2 = result.observations[1];
    assert.equal(obs2.value, null);
    assert.equal(obs2.qualityFlag, 'MISSING');

    assert.equal(result.spatialFootprint.pixelAreaHectares, 6.25);
    assert.equal(result.spatialFootprint.isSubPixelObservation, true);
  });
});
