import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { GpmClient } from '../src/integrations/satellite/gpmClient.js';
import { normalizeGpmImerg } from '../src/integrations/satellite/satelliteNormalizer.js';
import { SATELLITE_STATUS } from '../src/integrations/satellite/satelliteConfig.js';

describe('Stage 6: GPM IMERG Precipitation Suite', () => {
  const gpm = new GpmClient();

  test('Differentiates Late Run (~14h latency) from Final Run (~3.5 months, gauge calibrated)', () => {
    const specs = gpm.getRunSpecifications();
    assert.equal(specs.late.product, 'GPM_3IMERGDL.07');
    assert.equal(specs.late.gaugeCalibrated, false);
    assert.equal(specs.late.climatologicalAdjustment, true);

    assert.equal(specs.final.product, 'GPM_3IMERGDF.07');
    assert.equal(specs.final.gaugeCalibrated, true);
    assert.match(specs.final.gaugeSource, /GPCC/);
  });

  test('Preserves genuine 0.0 mm rainfall as valid physical measurement', () => {
    const decoded = gpm.decodePrecipitationValue(0.0, 'LATE');
    assert.equal(decoded.scaledVal, 0.0);
    assert.equal(decoded.isZeroRainfall, true);
    assert.equal(decoded.qualityFlag, 'NOMINAL');
    assert.equal(decoded.unit, 'mm/day');
  });

  test('Maps -9999.9 fill value to null with MISSING quality flag without coercing to zero', () => {
    const decoded = gpm.decodePrecipitationValue(-9999.9, 'LATE');
    assert.equal(decoded.scaledVal, null);
    assert.equal(decoded.qualityFlag, 'MISSING');
  });

  test('normalizeGpmImerg produces canonical RAINFALL_ACCUMULATION with SATELLITE_DERIVED origin', () => {
    const rawData = [
      { observationDate: '2026-11-15', precipitation: 14.5 },
      { observationDate: '2026-11-16', precipitation: 0.0 }
    ];

    const result = normalizeGpmImerg(rawData, {
      runType: 'LATE',
      farmAreaHectares: 1.5
    });

    assert.equal(result.status, SATELLITE_STATUS.SUCCESS);
    assert.equal(result.dataset, 'GPM_IMERG');
    assert.equal(result.product, 'GPM_3IMERGDL.07');
    assert.equal(result.observations.length, 2);

    const obs1 = result.observations[0];
    assert.equal(obs1.parameter, 'RAINFALL_ACCUMULATION');
    assert.equal(obs1.value, 14.5);
    assert.equal(obs1.unit, 'mm/day');
    assert.equal(obs1.dataOrigin, 'SATELLITE_DERIVED');
    assert.equal(obs1.sourceName, 'NASA_GPM');

    const obs2 = result.observations[1];
    assert.equal(obs2.value, 0.0);
    assert.equal(obs2.metadata.isZeroRainfall, true);

    // Verify spatial footprint warning for 10km grid over 1.5 ha farm
    assert.equal(result.spatialFootprint.isSubPixelObservation, true);
    assert.match(result.spatialFootprint.spatialDisclaimer, /smaller than the single satellite pixel/);
  });
});
