/**
 * Controller for NASA Satellite Data Integration Endpoints
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
      message: 'NASA Satellite integration status and capability metadata retrieved.',
      data: statusData
    });
  } catch (err) {
    next(err);
  }
}

export async function getProducts(req, res, next) {
  try {
    const productsData = satelliteService.getProducts();
    return successResponse(res, {
      statusCode: 200,
      message: 'Verified NASA satellite products catalog retrieved.',
      data: productsData
    });
  } catch (err) {
    next(err);
  }
}

export async function searchCmr(req, res, next) {
  try {
    const {
      type = 'collections',
      keyword,
      shortName,
      version,
      boundingBox,
      point,
      temporal,
      pageSize,
      forceRefresh
    } = req.query;

    const result = await satelliteService.searchCmr({
      type,
      keyword,
      shortName,
      version,
      boundingBox,
      point,
      temporal,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      forceRefresh: forceRefresh === 'true'
    });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to search NASA CMR catalog.',
        errorCode: result.integrationStatus || 'CMR_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: `NASA CMR ${type} search completed successfully.`,
      data: result,
      meta: {
        provider: 'NASA_CMR',
        cached: Boolean(result.fromCache),
        type,
        total: result.total
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function submitAppeearsTask(req, res, next) {
  try {
    const { taskType = 'point', taskName, params, farmId } = req.body;

    if (!taskName || !params) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'taskName and params are required for AppEEARS task submission.',
        errorCode: 'INVALID_PARAMETERS'
      });
    }

    const result = await satelliteService.submitAppeearsTask({
      taskType,
      taskName,
      params,
      farmId
    });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to submit AppEEARS task.',
        errorCode: result.integrationStatus || 'APPEEARS_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: 202,
      message: 'AppEEARS asynchronous extraction task submitted successfully.',
      data: result,
      meta: {
        provider: 'NASA_APPEEARS',
        taskId: result.taskId,
        status: result.status
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAppeearsTaskStatus(req, res, next) {
  try {
    const { taskId } = req.params;

    const result = await satelliteService.getAppeearsTaskStatus(taskId);

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to retrieve AppEEARS task status.',
        errorCode: result.integrationStatus || 'APPEEARS_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'AppEEARS task processing status retrieved.',
      data: result,
      meta: {
        provider: 'NASA_APPEEARS',
        taskId,
        status: result.status,
        progress: result.progress
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAppeearsTaskData(req, res, next) {
  try {
    const { taskId } = req.params;

    const result = await satelliteService.getAppeearsTaskData(taskId);

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to retrieve AppEEARS task output bundle.',
        errorCode: result.integrationStatus || 'APPEEARS_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'AppEEARS task output bundle retrieved successfully.',
      data: result,
      meta: {
        provider: 'NASA_APPEEARS',
        taskId,
        totalFiles: result.totalFiles,
        disclaimer: result.disclaimer
      }
    });
  } catch (err) {
    next(err);
  }
}
