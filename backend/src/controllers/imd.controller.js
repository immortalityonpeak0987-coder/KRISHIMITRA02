/**
 * Controller for IMD Environmental Ingestion Endpoints
 * 
 * An independent submission for Seva First Innovation Challenge – Eastern Region | West Bengal, India
 */

import { imdService } from '../integrations/imd/imd.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /api/integrations/imd/status
 * GET /api/v1/integrations/imd/status
 */
export async function getProviderStatus(req, res, next) {
  try {
    const statusData = imdService.getStatus();
    return successResponse(res, {
      statusCode: 200,
      message: 'IMD provider status and capabilities retrieved successfully.',
      data: statusData
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/integrations/imd/current_wx
 * GET /api/integrations/imd/current-weather
 */
export async function getCurrentWeather(req, res, next) {
  try {
    const stationId = req.query.stationId || req.query.station_id;
    const district = req.query.district;
    const farmId = req.query.farmId || req.query.farm_id;
    const forceRefresh = req.query.forceRefresh === 'true' || req.query.refresh === 'true';

    const result = await imdService.getCurrentWeather({
      stationId,
      district,
      farmId,
      forceRefresh
    });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to retrieve IMD current weather.',
        errorCode: result.integrationStatus || 'IMD_ERROR',
        details: result.details || (result.availabilityState ? { availabilityState: result.availabilityState } : null)
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'IMD current weather data retrieved successfully.',
      data: result,
      meta: {
        provider: 'IMD',
        endpoint: '/current_wx',
        cached: Boolean(result.fromCache),
        integrationStatus: result.integrationStatus,
        disclaimer: result.disclaimer
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/integrations/imd/districtrainfall
 * GET /api/integrations/imd/district-rainfall
 */
export async function getDistrictRainfall(req, res, next) {
  try {
    const district = req.query.district;
    const date = req.query.date;
    const farmId = req.query.farmId || req.query.farm_id;
    const forceRefresh = req.query.forceRefresh === 'true' || req.query.refresh === 'true';

    const result = await imdService.getDistrictRainfall({
      district,
      date,
      farmId,
      forceRefresh
    });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to retrieve IMD district rainfall.',
        errorCode: result.integrationStatus || 'IMD_ERROR',
        details: result.details || (result.availabilityState ? { availabilityState: result.availabilityState } : null)
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'IMD district rainfall data retrieved successfully.',
      data: result,
      meta: {
        provider: 'IMD',
        endpoint: '/districtrainfall',
        cached: Boolean(result.fromCache),
        integrationStatus: result.integrationStatus,
        disclaimer: result.disclaimer
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/integrations/imd/staterainfall
 * GET /api/integrations/imd/state-rainfall
 */
export async function getStateRainfall(req, res, next) {
  try {
    const date = req.query.date;
    const farmId = req.query.farmId || req.query.farm_id;
    const forceRefresh = req.query.forceRefresh === 'true' || req.query.refresh === 'true';

    const result = await imdService.getStateRainfall({
      date,
      farmId,
      forceRefresh
    });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to retrieve IMD state rainfall.',
        errorCode: result.integrationStatus || 'IMD_ERROR',
        details: result.details || (result.availabilityState ? { availabilityState: result.availabilityState } : null)
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'IMD state rainfall data retrieved successfully.',
      data: result,
      meta: {
        provider: 'IMD',
        endpoint: '/staterainfall',
        cached: Boolean(result.fromCache),
        integrationStatus: result.integrationStatus,
        disclaimer: result.disclaimer
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/integrations/imd/aws_data
 * GET /api/integrations/imd/aws
 */
export async function getAwsData(req, res, next) {
  try {
    const stationId = req.query.stationId || req.query.station_id;
    const district = req.query.district;
    const farmId = req.query.farmId || req.query.farm_id;
    const forceRefresh = req.query.forceRefresh === 'true' || req.query.refresh === 'true';

    const result = await imdService.getAwsData({
      stationId,
      district,
      farmId,
      forceRefresh
    });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to retrieve IMD AWS data.',
        errorCode: result.integrationStatus || 'IMD_ERROR',
        details: result.details || (result.availabilityState ? { availabilityState: result.availabilityState } : null)
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'IMD AWS station telemetry data retrieved successfully.',
      data: result,
      meta: {
        provider: 'IMD',
        endpoint: '/aws_data',
        cached: Boolean(result.fromCache),
        integrationStatus: result.integrationStatus,
        disclaimer: result.disclaimer
      }
    });
  } catch (err) {
    next(err);
  }
}
