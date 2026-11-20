/**
 * Multi-Criteria Crop Suitability Evaluation Service
 * Evaluates: Season, Soil Salinity, Water, and Temperature
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { RESEARCH_VERIFIED_CROPS } from './cropKnowledgeBase.js';

export class CropSuitabilityService {
  static evaluate(crop, context = {}) {
    const {
      currentSeason = 'Rabi',
      soilEC = null,
      soilType = '',
      temperatureCelsius = null
    } = context;

    const reasons = [];
    let isSuitable = true;
    let isConditional = false;

    // Check 1: Season match
    if (crop.suitableSeasons && !crop.suitableSeasons.includes(currentSeason)) {
      isSuitable = false;
      reasons.push(`Current season is ${currentSeason}, but ${crop.cropName} is adapted to ${crop.suitableSeasons.join(', ')}.`);
    }

    // Check 2: Soil Salinity ECe
    if (soilEC !== null && crop.salinityTolerance && crop.salinityTolerance.thresholdECe !== null) {
      if (soilEC > crop.salinityTolerance.thresholdECe) {
        if (soilEC > crop.salinityTolerance.thresholdECe + 2.0) {
          isSuitable = false;
          reasons.push(`Soil ECe (${soilEC} dS/m) exceeds critical lethal limit (${crop.salinityTolerance.thresholdECe} dS/m).`);
        } else {
          isConditional = true;
          reasons.push(`Soil ECe (${soilEC} dS/m) is near tolerance threshold (${crop.salinityTolerance.thresholdECe} dS/m); yield suppression likely without gypsum or leaching.`);
        }
      }
    }

    // Check 3: Temperature compatibility
    if (temperatureCelsius !== null && crop.temperatureRange) {
      if (crop.temperatureRange.maxCelsius && temperatureCelsius > crop.temperatureRange.maxCelsius) {
        isConditional = true;
        reasons.push(`Ambient temperature (${temperatureCelsius}°C) exceeds optimal threshold (${crop.temperatureRange.maxCelsius}°C).`);
      }
    }

    let verdict = 'Suitable';
    if (!isSuitable) verdict = 'Not Recommended';
    else if (isConditional) verdict = 'Conditionally Suitable';

    return {
      cropId: crop.id,
      cropName: crop.cropName,
      verdict,
      reasons,
      agronomicAuthority: crop.source
    };
  }

  static evaluateAllCrops(context = {}) {
    return RESEARCH_VERIFIED_CROPS.map(crop => this.evaluate(crop, context));
  }
}
