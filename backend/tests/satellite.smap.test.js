import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { SmapClient } from '../src/integrations/satellite/smapClient.js';
import { normalizeSmapSoilMoisture } from '../src/integrations/satellite/satelliteNormalizer.js';
import { SATELLITE_STATUS } from '../src/integrations/satellite/satelliteConfig.js';

describe('Stage 6: SMAP Soil Moisture Suite', () => {
  const smap = new SmapClient();

  test('Distinguishes Surface (0-5 cm) from Root-Zone (0-100 cm) depth specifications', () => {
    const specs = smap.getDepthSpecifications();
    assert.equal(specs.surfaceL3.depth, '0-5 cm');
    assert.match(specs.surfaceL3.scientificNote, /top 5 cm/i);
    assert.equal(specs.rootZoneL4.surfaceDepth, '0-5 cm');
    assert.equal(specs.rootZoneL4.rootZoneDepth, '0-100 cm');
  });

  test('Decodes volumetric soil moisture and preserves cm³/cm³ unit', () => {
    const decoded = smap.decodeSoilMoistureValue(0.245, 'SURFACE');
    assert.equal(decoded.scaledVal, 0.245);
    assert.equal(decoded.unit, 'cm³/cm³');
    assert.equal(decoded.qualityFlag, 'NOMINAL');
    assert.equal(decoded.depthCategory, 'SURFACE (0-5 cm)');
  });

  test('Maps fill values (<= -9990.0) to null with MISSING quality flag', () => {
    const decoded = smap.decodeSoilMoistureValue(-9999.0);
    assert.equal(decoded.scaledVal, null);
    assert.equal(decoded.qualityFlag, 'MISSING');
  });

  test('Flags out-of-range soil moisture readings as SUSPECT', () => {
    const decoded = smap.decodeSoilMoistureValue(1.25); // exceeds physical porosity bounds (0.0 to 0.9)
    assert.equal(decoded.qualityFlag, 'SUSPECT');
  });

  test('normalizeSmapSoilMoisture calculates 9km spatial footprint and sets SATELLITE_DERIVED origin', () => {
    const rawData = [
      { observationDate: '2026-11-15', soil_moisture: 0.22, depthCategory: 'SURFACE' }
    ];

    const result = normalizeSmapSoilMoisture(rawData, { farmAreaHectares: 2.0 });
    assert.equal(result.status, SATELLITE_STATUS.SUCCESS);
    assert.equal(result.dataset, 'SMAP');
    assert.equal(result.observations[0].parameter, 'SOIL_MOISTURE');
    assert.equal(result.observations[0].value, 0.22);
    assert.equal(result.observations[0].unit, 'cm³/cm³');
    assert.equal(result.observations[0].dataOrigin, 'SATELLITE_DERIVED');
    assert.equal(result.spatialFootprint.isSubPixelObservation, true);
    assert.equal(result.spatialFootprint.pixelAreaHectares, 8100);
  });
});
