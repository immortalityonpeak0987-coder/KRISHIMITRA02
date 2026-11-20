import { CropIntelligenceService } from '../services/crop-intelligence/cropIntelligenceService.js';
import { CropCalendarService } from '../services/crop-intelligence/cropCalendarService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export function getCropsCatalog(req, res, next) {
  try {
    const catalog = CropIntelligenceService.getCropsCatalog();
    return successResponse(res, {
      statusCode: 200,
      message: 'Research-verified West Bengal crops catalog retrieved.',
      data: {
        count: catalog.length,
        crops: catalog
      }
    });
  } catch (err) {
    next(err);
  }
}

export function getCropById(req, res, next) {
  try {
    const { cropId } = req.params;
    const crop = CropIntelligenceService.getCropById(cropId);
    if (!crop) {
      return errorResponse(res, {
        statusCode: 404,
        message: `Crop with ID '${cropId}' not found in knowledge base.`,
        errorCode: 'CROP_NOT_FOUND'
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Crop details retrieved.',
      data: crop
    });
  } catch (err) {
    next(err);
  }
}

export function getRotationRecommendations(req, res, next) {
  try {
    const { farmId } = req.params;
    const result = CropIntelligenceService.getRotationRecommendations(farmId);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export function simulateClimateScenario(req, res, next) {
  try {
    const { farmId } = req.params;
    const { tempOffsetCelsius, rainfallOffsetPercent, sowingDelayDays } = req.body || {};

    const result = CropIntelligenceService.simulateScenario({
      farmId,
      tempOffsetCelsius,
      rainfallOffsetPercent,
      sowingDelayDays
    });

    return successResponse(res, {
      statusCode: 200,
      message: 'Scenario simulation completed.',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export function getCropIntelligence(req, res, next) {
  try {
    const { farmId } = req.params;
    const { currentSeason, soilEC, temperatureCelsius } = req.query;

    const suitability = CropIntelligenceService.evaluateSuitability({
      currentSeason: currentSeason || 'Rabi',
      soilEC: soilEC ? parseFloat(soilEC) : null,
      temperatureCelsius: temperatureCelsius ? parseFloat(temperatureCelsius) : null
    });

    const rotation = CropIntelligenceService.getRotationRecommendations(farmId);

    return successResponse(res, {
      statusCode: 200,
      message: 'Crop intelligence evaluation retrieved.',
      data: {
        farmId,
        suitability,
        rotation: rotation.data
      }
    });
  } catch (err) {
    next(err);
  }
}

export function getCropCalendar(req, res, next) {
  try {
    const { cropName = 'Aman Paddy' } = req.query;
    const calendar = CropCalendarService.getAnnualCalendar(cropName);

    return successResponse(res, {
      statusCode: 200,
      message: 'Annual crop calendar retrieved.',
      data: calendar
    });
  } catch (err) {
    next(err);
  }
}
