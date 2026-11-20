/**
 * Crop Intelligence Main Orchestrator
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { RESEARCH_VERIFIED_CROPS } from './cropKnowledgeBase.js';
import { CropCalendarService } from './cropCalendarService.js';
import { CropRotationService } from './cropRotationService.js';
import { CropSuitabilityService } from './cropSuitabilityService.js';
import { CropSimulationService } from './cropSimulationService.js';

export class CropIntelligenceService {
  static getCropsCatalog() {
    return RESEARCH_VERIFIED_CROPS;
  }

  static getCropById(cropId) {
    return RESEARCH_VERIFIED_CROPS.find(c => c.id === cropId || c.cropName.toLowerCase() === cropId.toLowerCase()) || null;
  }

  static getRotationRecommendations(farmId, currentRotation) {
    const recs = CropRotationService.getRecommendationsForFarm(farmId, currentRotation);
    return {
      status: 'success',
      data: recs,
      metadata: {
        agronomicAuthority: 'West Bengal Crop Planning Calendar & Regional Agronomic Reference',
        pilotRegion: String(farmId).toLowerCase().includes('gosaba') ? 'Coastal Sundarbans Delta' : 'Gangetic Alluvial Plain',
        rulesChecked: recs.rulesChecked
      }
    };
  }

  static evaluateSuitability(context) {
    return CropSuitabilityService.evaluateAllCrops(context);
  }

  static simulateScenario(params) {
    return CropSimulationService.simulate(params);
  }
}
