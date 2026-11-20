/**
 * Controller for Dedicated NASA CMR Endpoints (/api/integrations/cmr/*)
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { satelliteService } from '../integrations/satellite/satelliteService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function getStatus(req, res, next) {
  try {
    const statusData = satelliteService.getStatus();
    return successResponse(res, {
      statusCode: 200,
      message: 'NASA CMR integration status and capability metadata retrieved.',
      data: {
        provider: 'NASA CMR',
        endpoint: statusData.cmrBaseUrl,
        status: 'AVAILABLE',
        serviceType: 'METADATA_DISCOVERY_SERVICE',
        authRequired: false,
        capabilities: {
          collectionSearch: true,
          granuleSearch: true,
          spatialBoundingBox: true,
          temporalSearch: true
        },
        disclaimer: 'CMR is a metadata catalog and discovery service. It does not perform raster computation.'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getCollections(req, res, next) {
  try {
    const { keyword, shortName, version, boundingBox, pageSize = 10, forceRefresh } = req.query;

    const result = await satelliteService.searchCmr({
      type: 'collections',
      keyword,
      shortName,
      version,
      boundingBox,
      pageSize: parseInt(pageSize, 10) || 10,
      forceRefresh: forceRefresh === 'true'
    });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to search NASA CMR collections.',
        errorCode: result.integrationStatus || 'CMR_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'NASA CMR collections discovered successfully.',
      data: result,
      meta: {
        provider: 'NASA CMR',
        cached: Boolean(result.fromCache),
        total: result.total
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getGranules(req, res, next) {
  try {
    const { shortName, version, boundingBox, point, temporal, pageSize = 10, forceRefresh } = req.query;

    const result = await satelliteService.searchCmr({
      type: 'granules',
      shortName,
      version,
      boundingBox,
      point,
      temporal,
      pageSize: parseInt(pageSize, 10) || 10,
      forceRefresh: forceRefresh === 'true'
    });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to search NASA CMR observation granules.',
        errorCode: result.integrationStatus || 'CMR_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'NASA CMR observation granules discovered successfully.',
      data: result,
      meta: {
        provider: 'NASA CMR',
        cached: Boolean(result.fromCache),
        total: result.total
      }
    });
  } catch (err) {
    next(err);
  }
}
