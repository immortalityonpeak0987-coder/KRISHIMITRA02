import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { RISK_LEVELS } from '../src/services/risk/riskConstants.js';
import { RainfallRiskService } from '../src/services/risk/rainfallRiskService.js';
import { WaterloggingRiskService } from '../src/services/risk/waterloggingRiskService.js';
import { DroughtRiskService } from '../src/services/risk/droughtRiskService.js';
import { HeatStressRiskService } from '../src/services/risk/heatStressRiskService.js';
import { SoilSalinityRiskService } from '../src/services/risk/soilSalinityRiskService.js';
import { RiskScoringService } from '../src/services/risk/riskScoringService.js';
import { RiskAssessmentService } from '../src/services/risk/riskAssessmentService.js';

describe('Module 2: Agricultural Risk Assessment Suite', () => {
  test('RainfallRiskService screens heavy precipitation and handles missing series', () => {
    // Normal rainfall
    const normal = RainfallRiskService.assess([{ standardizedValue: 10 }, { standardizedValue: 15 }]);
    assert.equal(normal.level, RISK_LEVELS.LOW);

    // Heavy rainfall (> 175mm in 7 days)
    const heavyObs = Array(7).fill({ standardizedValue: 30 }); // 210 mm
    const heavy = RainfallRiskService.assess(heavyObs);
    assert.equal(heavy.level, RISK_LEVELS.HIGH);

    // Missing data returns INDETERMINATE, never LOW
    const missing = RainfallRiskService.assess([]);
    assert.equal(missing.level, RISK_LEVELS.INDETERMINATE);
  });

  test('WaterloggingRiskService requires multi-factor evidence', () => {
    // Low rain
    const low = WaterloggingRiskService.assess({ rainfall7DayMm: 20 });
    assert.equal(low.level, RISK_LEVELS.LOW);

    // High rain + Heavy clay + Lowland topography = HIGH
    const high = WaterloggingRiskService.assess({
      rainfall7DayMm: 180,
      soilType: 'Saline Coastal Clay',
      farmType: 'Coastal Saline Lowland'
    });
    assert.equal(high.level, RISK_LEVELS.HIGH);
    assert.match(high.indicator, /heavy clay texture and lowland delta elevation/i);

    // Moderate rain without verified drainage includes limitation note
    const mod = WaterloggingRiskService.assess({ rainfall7DayMm: 110, soilType: 'Alluvial Loam' });
    assert.equal(mod.level, RISK_LEVELS.MODERATE);
    assert.ok(mod.limitation);
  });

  test('DroughtRiskService checks root-zone moisture and respects crop calendar', () => {
    // Non-cropping season / fallow is LOW, not drought
    const fallow = DroughtRiskService.assess({ isCroppingSeason: false });
    assert.equal(fallow.level, RISK_LEVELS.LOW);
    assert.match(fallow.indicator, /outside main active crop growing season/i);

    // Active season with rain deficit + root-zone moisture deficit (< 0.15) = HIGH
    const severe = DroughtRiskService.assess({
      rainfall14DayMm: 2.0,
      rootZoneMoisture: 0.11,
      isCroppingSeason: true,
      currentCrop: 'Aman Paddy'
    });
    assert.equal(severe.level, RISK_LEVELS.HIGH);

    // Missing both rain and moisture returns INDETERMINATE
    const missing = DroughtRiskService.assess({ rainfall14DayMm: null, rootZoneMoisture: null });
    assert.equal(missing.level, RISK_LEVELS.INDETERMINATE);
  });

  test('HeatStressRiskService evaluates crop-specific critical thresholds', () => {
    // 32°C is HIGH for potato (threshold 30°C), but LOW for cotton/paddy (threshold 35°C)
    const hotDays = [31.5, 32.0, 31.8, 32.2];
    const potatoHeat = HeatStressRiskService.assess(hotDays, 'Kufri Pukhraj Potato');
    assert.equal(potatoHeat.level, RISK_LEVELS.HIGH);

    const paddyHeat = HeatStressRiskService.assess(hotDays, 'Aman Paddy');
    assert.equal(paddyHeat.level, RISK_LEVELS.LOW);

    // Missing temperature returns INDETERMINATE
    const missing = HeatStressRiskService.assess([]);
    assert.equal(missing.level, RISK_LEVELS.INDETERMINATE);
  });

  test('SoilSalinityRiskService strictly requires verified laboratory EC in dS/m', () => {
    // Missing laboratory EC strictly returns INDETERMINATE with warning
    const noTest = SoilSalinityRiskService.assess(null);
    assert.equal(noTest.level, RISK_LEVELS.INDETERMINATE);
    assert.match(noTest.limitation, /do not directly measure soil electrical conductivity/i);

    // Verified Safe (< 2.0 dS/m)
    const safe = SoilSalinityRiskService.assess({
      electricalConductivity: { value: 0.35, unit: 'dS/m' },
      laboratoryName: 'Burdwan District Soil Lab'
    });
    assert.equal(safe.level, RISK_LEVELS.LOW);

    // Verified High (> 4.0 dS/m)
    const high = SoilSalinityRiskService.assess({
      electricalConductivity: { value: 4.8, unit: 'dS/m' },
      laboratoryName: 'Canning Coastal Soil Lab'
    });
    assert.equal(high.level, RISK_LEVELS.HIGH);
    assert.match(high.recommendation, /avoid water-intensive boro rice/i);
  });

  test('RiskScoringService synthesizes multi-hazard matrix without crude score addition', () => {
    const factors = [
      { category: 'Coastal Soil Salinity', level: RISK_LEVELS.HIGH },
      { category: 'Flood & Waterlogging', level: RISK_LEVELS.MODERATE },
      { category: 'Heat Stress', level: RISK_LEVELS.LOW }
    ];
    const composite = RiskScoringService.synthesize(factors);
    assert.equal(composite.riskLevelEnum, RISK_LEVELS.HIGH);
    assert.equal(composite.overallRiskLevel, 'High Vulnerability');
    assert.ok(composite.score > 50);

    // All indeterminate returns Indeterminate, never Low
    const indet = RiskScoringService.synthesize([{ level: RISK_LEVELS.INDETERMINATE }]);
    assert.equal(indet.riskLevelEnum, RISK_LEVELS.INDETERMINATE);
    assert.strictEqual(indet.score, null);
  });

  test('RiskAssessmentService matches frontend riskService.js contract', async () => {
    const res = await RiskAssessmentService.assessFarm('farm-bardhaman-01');
    assert.equal(res.status, 'success');
    assert.ok(res.data.overallRiskLevel);
    assert.ok(Array.isArray(res.data.riskFactors));
    assert.equal(res.data.riskFactors.length, 5);
    assert.ok(res.data.methodology);
    assert.ok(res.metadata.assessedAt);
  });
});
