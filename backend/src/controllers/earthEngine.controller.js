/**
 * Controller for Google Earth Engine REST API Integration Endpoints
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { earthEngineService } from '../integrations/earthEngine/earthEngine.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function getStatus(req, res, next) {
  try {
    const statusData = earthEngineService.getStatus();
    return successResponse(res, {
      statusCode: 200,
      message: 'Google Earth Engine provider status and capabilities retrieved successfully.',
      data: statusData
    });
  } catch (err) {
    next(err);
  }
}

export async function getConfig(req, res, next) {
  try {
    const configData = earthEngineService.getConfig();
    return successResponse(res, {
      statusCode: 200,
      message: 'Google Earth Engine project configuration requirements retrieved.',
      data: configData
    });
  } catch (err) {
    next(err);
  }
}

export async function getDiscovery(req, res, next) {
  try {
    const forceRefresh = req.query.forceRefresh === 'true' || req.query.refresh === 'true';
    const result = await earthEngineService.getDiscovery({ forceRefresh });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 502,
        message: result.error || 'Failed to retrieve Earth Engine discovery document.',
        errorCode: result.integrationStatus || 'EARTH_ENGINE_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Google Earth Engine discovery schema retrieved successfully.',
      data: result.data,
      meta: {
        provider: 'Google Earth Engine',
        cached: Boolean(result.fromCache),
        integrationStatus: result.integrationStatus,
        disclaimer: result.disclaimer
      }
    });
  } catch (err) {
    next(err);
  }
}
