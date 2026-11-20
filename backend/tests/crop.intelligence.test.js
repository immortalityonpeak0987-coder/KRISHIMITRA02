import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { RESEARCH_VERIFIED_CROPS } from '../src/services/crop-intelligence/cropKnowledgeBase.js';
import { CropCalendarService } from '../src/services/crop-intelligence/cropCalendarService.js';
import { CropRotationService } from '../src/services/crop-intelligence/cropRotationService.js';
import { CropSuitabilityService } from '../src/services/crop-intelligence/cropSuitabilityService.js';
import { CropSimulationService } from '../src/services/crop-intelligence/cropSimulationService.js';
import { CropIntelligenceService } from '../src/services/crop-intelligence/cropIntelligenceService.js';

describe('Module 3: Crop Intelligence Suite', () => {
  test('Knowledge base contains verified West Bengal crops with traceable citations', () => {
    assert.ok(RESEARCH_VERIFIED_CROPS.length >= 5);
    const potato = RESEARCH_VERIFIED_CROPS.find(c => c.cropName === 'Kufri Pukhraj Potato');
    assert.ok(potato);
    assert.equal(potato.cropCategory, 'Tuber');
    assert.equal(potato.durationDays, 75);
    assert.equal(potato.temperatureRange.maxCelsius, 30);
    assert.match(potato.source, /CPRI/i);

    const khesari = RESEARCH_VERIFIED_CROPS.find(c => c.cropName === 'Grass Pea (Khesari)');
    assert.ok(khesari);
    assert.equal(khesari.nitrogenFixing, true);
    assert.ok(khesari.salinityTolerance.thresholdECe >= 4.0);
  });

  test('CropCalendarService produces 12-month calendar with phenological stages', () => {
    const calendarData = CropCalendarService.getAnnualCalendar('Aman Paddy');
    assert.equal(calendarData.calendar.length, 12);
    assert.equal(calendarData.crop, 'Aman Paddy');
    assert.equal(calendarData.family, 'Poaceae');

    const jul = calendarData.calendar.find(m => m.month === 'Jul');
    assert.equal(jul.stage, 'Establishment');

    const nov = calendarData.calendar.find(m => m.month === 'Nov');
    assert.equal(nov.stage, 'Harvest');
  });

  test('CropRotationService flags continuous family cropping and verifies legume benefits', () => {
    // Family repetition: Potato followed by Potato (Solanaceae -> Solanaceae)
    const repetition = CropRotationService.evaluateRotation(['Kufri Pukhraj Potato'], 'Kufri Pukhraj Potato');
    assert.equal(repetition.isRecommended, false);
    assert.ok(repetition.issues.some(i => i.includes('Solanaceae')));

    // Legume nitrogen restoration: Paddy followed by Grass Pea (Poaceae -> Fabaceae)
    const legumeSeq = CropRotationService.evaluateRotation(['Aman Paddy'], 'Grass Pea (Khesari)');
    assert.equal(legumeSeq.isRecommended, true);
    assert.ok(legumeSeq.benefits.some(b => b.includes('Rhizobium')));
  });

  test('CropSuitabilityService evaluates multi-criteria seasonal and salinity match', () => {
    const potato = RESEARCH_VERIFIED_CROPS.find(c => c.cropName === 'Kufri Pukhraj Potato');

    // Rabi season + Sweet soil (< 1.7 dS/m) = Suitable
    const suitable = CropSuitabilityService.evaluate(potato, { currentSeason: 'Rabi', soilEC: 0.5 });
    assert.equal(suitable.verdict, 'Suitable');

    // Wrong season (Kharif) = Not Recommended
    const wrongSeason = CropSuitabilityService.evaluate(potato, { currentSeason: 'Kharif', soilEC: 0.5 });
    assert.equal(wrongSeason.verdict, 'Not Recommended');

    // Saline soil (> 3.5 dS/m for sensitive potato) = Not Recommended
    const saline = CropSuitabilityService.evaluate(potato, { currentSeason: 'Rabi', soilEC: 4.8 });
    assert.equal(saline.verdict, 'Not Recommended');
  });

  test('CropSimulationService models sowing delays, rainfall deficits, and thermal shifts', () => {
    const res = CropSimulationService.simulate({
      farmId: 'farm-bardhaman-01',
      tempOffsetCelsius: 2.0,
      rainfallOffsetPercent: -30,
      sowingDelayDays: 16
    });

    assert.ok(res.vulnerabilityIndex > 60);
    assert.match(res.waterStressVerdict, /Severe Irrigation Deficit/i);
    assert.match(res.harvestWindowVerdict, /Critical Shift/i);
    assert.match(res.suggestedAdjustment, /short-duration cultivars/i);
  });

  test('CropIntelligenceService matches frontend cropService.js contract', () => {
    const rotationRecs = CropIntelligenceService.getRotationRecommendations('farm-bardhaman-01');
    assert.equal(rotationRecs.status, 'success');
    assert.ok(Array.isArray(rotationRecs.data.recommendedSequence));
    assert.ok(rotationRecs.metadata.agronomicAuthority);
    assert.ok(Array.isArray(rotationRecs.metadata.rulesChecked));
  });
});
