import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  Farm,
  Crop,
  CropRotation,
  EnvironmentalObservation,
  RiskAssessment,
  RecoveryRecord,
  SoilTest,
  Report,
  ApiCache,
  WEST_BENGAL_DISTRICTS,
  ENVIRONMENTAL_PARAMETERS
} from '../src/models/index.js';

describe('Stage 3: Mongoose Model Validation Suite', () => {

  // ----------------------------------------------------------------
  // 1. FARM MODEL VALIDATION
  // ----------------------------------------------------------------
  describe('Model A: Farm Validation', () => {
    test('Valid Farm document passes validation and calculates area conversions', async () => {
      const validFarm = new Farm({
        farmName: 'Bagila Alluvial Farm',
        locationName: 'Memari-I, Purba Bardhaman',
        district: 'Purba Bardhaman',
        coordinates: { latitude: 23.2324, longitude: 87.8615 },
        area: { value: 5, unit: 'Bigha' },
        dataOrigin: 'DEMO'
      });

      await assert.doesNotReject(async () => {
        await validFarm.validate();
      });

      assert.equal(validFarm.area.areaInHectares, 0.669, '5 Bigha should convert to 0.669 ha.');
      assert.equal(validFarm.area.areaInAcres, 1.653, '5 Bigha should convert to ~1.653 Acres.');
      assert.equal(validFarm.id, validFarm._id.toString(), 'Virtual id must match _id.');
    });

    test('Rejects invalid latitude and longitude coordinates', async () => {
      const invalidCoordsFarm = new Farm({
        farmName: 'Out of Bounds Farm',
        locationName: 'Unknown',
        district: 'Purba Bardhaman',
        coordinates: { latitude: 95.5, longitude: 195.0 },
        area: { value: 2, unit: 'Acre' }
      });

      await assert.rejects(async () => {
        await invalidCoordsFarm.validate();
      }, (err) => {
        assert.ok(err instanceof mongoose.Error.ValidationError);
        assert.ok(err.errors['coordinates.latitude'], 'Latitude 95.5 should be rejected.');
        assert.ok(err.errors['coordinates.longitude'], 'Longitude 195.0 should be rejected.');
        return true;
      });
    });

    test('Rejects invalid area values and unsupported units', async () => {
      const invalidAreaFarm = new Farm({
        farmName: 'Zero Area Farm',
        locationName: 'Singur',
        district: 'Hooghly',
        coordinates: { latitude: 22.8, longitude: 88.2 },
        area: { value: -1, unit: 'SquareFeet' }
      });

      await assert.rejects(async () => {
        await invalidAreaFarm.validate();
      }, (err) => {
        assert.ok(err instanceof mongoose.Error.ValidationError);
        assert.ok(err.errors['area.value'], 'Negative area should be rejected.');
        assert.ok(err.errors['area.unit'], 'Unsupported area unit should be rejected.');
        return true;
      });
    });

    test('Rejects non-West Bengal district names', async () => {
      const invalidDistrictFarm = new Farm({
        farmName: 'Non-Bengal Farm',
        locationName: 'Patna',
        district: 'Patna', // Not in 23 West Bengal districts
        coordinates: { latitude: 25.5, longitude: 85.1 },
        area: { value: 1, unit: 'Hectare' }
      });

      await assert.rejects(async () => {
        await invalidDistrictFarm.validate();
      }, (err) => {
        assert.ok(err instanceof mongoose.Error.ValidationError);
        assert.ok(err.errors['district'], 'Non-West Bengal district should be rejected.');
        return true;
      });
    });

    test('Soil type defaults to null and is not inferred automatically', () => {
      const farm = new Farm({
        farmName: 'Test Soil Farm',
        locationName: 'Gosaba',
        district: 'South 24 Parganas',
        coordinates: { latitude: 22.16, longitude: 88.8 },
        area: { value: 3, unit: 'Bigha' }
      });

      assert.equal(farm.soilType, null, 'Soil type must remain null unless explicitly provided.');
    });
  });

  // ----------------------------------------------------------------
  // 2. CROP MODEL VALIDATION
  // ----------------------------------------------------------------
  describe('Model B: Crop Validation', () => {
    test('Valid Crop passes validation and preserves null for unverified tolerances', async () => {
      const crop = new Crop({
        cropName: 'Aman Rice Test',
        cropCategory: 'Cereal',
        suitableSeasons: ['Kharif'],
        waterRequirement: 'High',
        dataOrigin: 'RESEARCH_VERIFIED'
      });

      await assert.doesNotReject(async () => {
        await crop.validate();
      });

      assert.equal(crop.salinityTolerance.thresholdECe, null, 'Unverified salinity tolerance must be null.');
      assert.equal(crop.temperatureRange.optimalCelsius, null, 'Unverified temperature must be null.');
    });

    test('Rejects invalid crop category', async () => {
      const invalidCrop = new Crop({
        cropName: 'Invalid Crop',
        cropCategory: 'NonExistentCategory',
        suitableSeasons: ['Kharif']
      });

      await assert.rejects(async () => {
        await invalidCrop.validate();
      }, (err) => {
        assert.ok(err instanceof mongoose.Error.ValidationError);
        assert.ok(err.errors['cropCategory']);
        return true;
      });
    });
  });

  // ----------------------------------------------------------------
  // 3. CROP ROTATION VALIDATION
  // ----------------------------------------------------------------
  describe('Model C: CropRotation Validation', () => {
    test('Valid CropRotation with farm reference passes validation', async () => {
      const farmId = new mongoose.Types.ObjectId();
      const rotation = new CropRotation({
        farm: farmId,
        year: 2026,
        monthlyPlan: [
          { month: 'Jan', cropName: 'Potato', stage: 'Bulbing' },
          { month: 'Feb', cropName: 'Potato', stage: 'Harvest' }
        ],
        dataOrigin: 'DEMO'
      });

      await assert.doesNotReject(async () => {
        await rotation.validate();
      });

      assert.equal(rotation.farm.toString(), farmId.toString());
    });

    test('Rejects CropRotation with missing farm reference or empty monthlyPlan', async () => {
      const invalidRotation = new CropRotation({
        year: 2026,
        monthlyPlan: []
      });

      await assert.rejects(async () => {
        await invalidRotation.validate();
      }, (err) => {
        assert.ok(err instanceof mongoose.Error.ValidationError);
        assert.ok(err.errors['farm'], 'Farm reference is mandatory.');
        assert.ok(err.errors['monthlyPlan'], 'Empty monthly plan must be rejected.');
        return true;
      });
    });
  });

  // ----------------------------------------------------------------
  // 4. ENVIRONMENTAL OBSERVATION VALIDATION
  // ----------------------------------------------------------------
  describe('Model D: EnvironmentalObservation Validation', () => {
    test('Missing observation value is stored as null and not coerced to zero', async () => {
      const obs = new EnvironmentalObservation({
        farm: new mongoose.Types.ObjectId(),
        parameter: 'RAINFALL_ACCUMULATION',
        value: null, // Null value represents missing scientific observation
        unit: 'mm',
        sourceName: 'NASA_GPM_IMERG',
        observationDate: new Date('2026-11-01'),
        dataOrigin: 'OBSERVED'
      });

      await assert.doesNotReject(async () => {
        await obs.validate();
      });

      assert.equal(obs.value, null, 'Scientific missing value must remain null, never 0.');
    });

    test('Rejects unrecognized environmental parameter', async () => {
      const invalidObs = new EnvironmentalObservation({
        farm: new mongoose.Types.ObjectId(),
        parameter: 'UNRECOGNIZED_PARAM',
        value: 10,
        unit: 'index',
        sourceName: 'Test',
        observationDate: new Date(),
        dataOrigin: 'DEMO'
      });

      await assert.rejects(async () => {
        await invalidObs.validate();
      }, (err) => {
        assert.ok(err instanceof mongoose.Error.ValidationError);
        assert.ok(err.errors['parameter']);
        return true;
      });
    });
  });

  // ----------------------------------------------------------------
  // 5. RISK ASSESSMENT VALIDATION
  // ----------------------------------------------------------------
  describe('Model E: RiskAssessment Validation', () => {
    test('Supports explicit INDETERMINATE riskLevel and null score', async () => {
      const assessment = new RiskAssessment({
        farm: new mongoose.Types.ObjectId(),
        riskType: 'COASTAL_SALINITY',
        riskLevel: 'INDETERMINATE',
        score: null,
        methodologyVersion: 'v1.0-deterministic',
        dataOrigin: 'CALCULATED'
      });

      await assert.doesNotReject(async () => {
        await assessment.validate();
      });

      assert.equal(assessment.riskLevel, 'INDETERMINATE');
      assert.equal(assessment.score, null, 'Score must remain null when indeterminate.');
    });

    test('Rejects out-of-range risk scores', async () => {
      const invalidAssessment = new RiskAssessment({
        farm: new mongoose.Types.ObjectId(),
        riskType: 'HEAT_STRESS',
        riskLevel: 'HIGH',
        score: 150 // Out of 0-100 bounds
      });

      await assert.rejects(async () => {
        await invalidAssessment.validate();
      }, (err) => {
        assert.ok(err instanceof mongoose.Error.ValidationError);
        assert.ok(err.errors['score']);
        return true;
      });
    });
  });

  // ----------------------------------------------------------------
  // 6. RECOVERY RECORD VALIDATION
  // ----------------------------------------------------------------
  describe('Model F: RecoveryRecord Validation', () => {
    test('recoveryScore strictly defaults to null', async () => {
      const record = new RecoveryRecord({
        farm: new mongoose.Types.ObjectId(),
        eventDate: new Date('2026-11-05'),
        eventType: 'FIELD_EVIDENCE',
        title: 'Post-rain field check',
        description: 'Checked water standing in potato furrows.',
        recoveryStatus: 'RECOVERING'
      });

      await assert.doesNotReject(async () => {
        await record.validate();
      });

      assert.equal(record.recoveryScore, null, 'recoveryScore must default strictly to null.');
    });
  });

  // ----------------------------------------------------------------
  // 7. SOIL TEST VALIDATION
  // ----------------------------------------------------------------
  describe('Model G: SoilTest Validation', () => {
    test('isVerifiedLab strictly defaults to false and chemical params are nullable', async () => {
      const soilTest = new SoilTest({
        farm: new mongoose.Types.ObjectId(),
        testDate: new Date('2026-10-01'),
        laboratoryName: 'Demonstration Test Lab',
        electricalConductivity: { value: 1.2, unit: 'dS/m' },
        dataOrigin: 'DEMO'
      });

      await assert.doesNotReject(async () => {
        await soilTest.validate();
      });

      assert.equal(soilTest.isVerifiedLab, false, 'isVerifiedLab must default strictly to false.');
      assert.equal(soilTest.pH, null, 'pH must remain null if unmeasured.');
      assert.equal(soilTest.organicCarbonPercent, null, 'Organic carbon must remain null if unmeasured.');
    });
  });

  // ----------------------------------------------------------------
  // 8. REPORT MODEL VALIDATION
  // ----------------------------------------------------------------
  describe('Model H: Report Validation', () => {
    test('Valid Report metadata passes validation', async () => {
      const report = new Report({
        farm: new mongoose.Types.ObjectId(),
        reportType: 'RESILIENCE_AUDIT',
        title: 'Q4 2026 Agro-Resilience Summary',
        format: 'JSON',
        dataOrigin: 'DEMO'
      });

      await assert.doesNotReject(async () => {
        await report.validate();
      });

      assert.equal(report.status, 'GENERATED');
    });
  });

  // ----------------------------------------------------------------
  // 9. API CACHE VALIDATION & INDEX DEFINITION
  // ----------------------------------------------------------------
  describe('Model I: ApiCache Validation', () => {
    test('Valid ApiCache passes schema validation', async () => {
      const cache = new ApiCache({
        cacheKey: 'nasa_power_t2m_23.23_87.86_202611',
        source: 'NASA_POWER',
        parameters: { lat: 23.23, lon: 87.86 },
        responseData: { tempMin: 16.5, tempMax: 28.2 },
        expiresAt: new Date(Date.now() + 86400000)
      });

      await assert.doesNotReject(async () => {
        await cache.validate();
      });
    });

    test('ApiCache schema includes TTL index and unique cacheKey', () => {
      const indexes = ApiCache.schema.indexes();
      const ttlIndex = indexes.find(idx => idx[0].expiresAt === 1 && idx[1]?.expireAfterSeconds === 0);
      assert.ok(ttlIndex, 'ApiCache must define a TTL index on expiresAt with expireAfterSeconds: 0.');

      const keyIndex = indexes.find(idx => idx[0].cacheKey === 1);
      assert.ok(keyIndex, 'ApiCache must define an index on cacheKey.');
    });
  });

});
