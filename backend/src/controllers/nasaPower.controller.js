import { nasaPowerService } from '../integrations/nasaPower/nasaPower.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller for NASA POWER Environmental Ingestion Endpoints
 */

/**
 * GET /api/integrations/nasa-power/farms/:farmId
 * GET /api/v1/integrations/nasa-power/farms/:farmId
 */
export async function getFarmData(req, res, next) {
  try {
    const { farmId } = req.params;
    const { startDate, endDate, parameters } = req.query;

    const result = await nasaPowerService.getFarmData({
      farmId,
      startDate,
      endDate,
      parameters
    });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to retrieve NASA POWER data for farm.',
        errorCode: result.integrationStatus || 'NASA_POWER_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: result.statusCode || 200,
      message: 'NASA POWER environmental data retrieved successfully for farm.',
      data: result.data,
      meta: {
        farm: result.farm || null,
        integrationStatus: result.integrationStatus,
        source: result.source,
        cached: result.cached,
        expiresAt: result.expiresAt,
        persistenceStatus: result.persistenceStatus
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/integrations/nasa-power/point
 * GET /api/v1/integrations/nasa-power/point
 */
export async function getPointData(req, res, next) {
  try {
    const { latitude, longitude, startDate, endDate, parameters } = req.query;

    const result = await nasaPowerService.getPointData({
      latitude,
      longitude,
      startDate,
      endDate,
      parameters
    });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to retrieve NASA POWER data for point.',
        errorCode: result.integrationStatus || 'NASA_POWER_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: result.statusCode || 200,
      message: 'NASA POWER point environmental data retrieved successfully.',
      data: result.data,
      meta: {
        integrationStatus: result.integrationStatus,
        source: result.source,
        cached: result.cached,
        expiresAt: result.expiresAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/integrations/nasa-power/status
 * GET /api/v1/integrations/nasa-power/status
 */
export function getProviderStatus(req, res, next) {
  try {
    const statusData = nasaPowerService.getProviderStatus();
    return successResponse(res, {
      statusCode: 200,
      message: 'NASA POWER provider status and capability metadata retrieved.',
      data: statusData
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getFarmData,
  getPointData,
  getProviderStatus
};
