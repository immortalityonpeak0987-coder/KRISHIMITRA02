/**
 * Controller for Dedicated NASA AppEEARS Endpoints (/api/integrations/appeears/*)
 * 
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { satelliteService } from '../integrations/satellite/satelliteService.js';
import { appeearsClient } from '../integrations/satellite/appeearsClient.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function getStatus(req, res, next) {
  try {
    const statusData = satelliteService.getStatus();
    return successResponse(res, {
      statusCode: 200,
      message: 'NASA AppEEARS integration status and capability metadata retrieved.',
      data: {
        provider: 'NASA AppEEARS',
        endpoint: statusData.appeearsBaseUrl,
        earthdataConfigured: statusData.earthdataConfigured,
        authStatus: statusData.earthdataConfigured ? 'AVAILABLE' : 'AUTH_REQUIRED',
        status: statusData.earthdataConfigured ? 'AVAILABLE' : 'AUTH_REQUIRED',
        serviceType: 'ASYNCHRONOUS_SUBSETTING_ENGINE',
        disclaimer: statusData.disclaimer
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getProducts(req, res, next) {
  try {
    const productsData = await appeearsClient.getProducts();
    return successResponse(res, {
      statusCode: 200,
      message: 'NASA AppEEARS product catalog retrieved successfully.',
      data: productsData
    });
  } catch (err) {
    next(err);
  }
}

export async function submitTask(req, res, next) {
  try {
    const { taskName, taskType = 'point', params } = req.body;
    const farmId = req.body.farmId || req.query.farmId;

    if (!taskName || !params) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'taskName and params are required for AppEEARS task submission.',
        errorCode: 'INVALID_PARAMETERS'
      });
    }

    const result = await satelliteService.submitAppeearsTask({
      taskName,
      taskType,
      params,
      farmId
    });

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to submit AppEEARS extraction task.',
        errorCode: result.integrationStatus || 'APPEEARS_TASK_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: 202,
      message: 'NASA AppEEARS task submitted successfully and queued for asynchronous processing.',
      data: result,
      meta: {
        provider: 'NASA AppEEARS',
        taskId: result.taskId,
        taskStatus: result.status
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getTaskStatus(req, res, next) {
  try {
    const { taskId } = req.params;
    const result = await satelliteService.getAppeearsTaskStatus(taskId);

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to retrieve AppEEARS task status.',
        errorCode: result.integrationStatus || 'APPEEARS_STATUS_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'NASA AppEEARS task status retrieved.',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function getTaskResults(req, res, next) {
  try {
    const { taskId } = req.params;
    const result = await satelliteService.getAppeearsTaskData(taskId);

    if (!result.success) {
      return errorResponse(res, {
        statusCode: result.statusCode || 400,
        message: result.error || 'Failed to retrieve AppEEARS task output bundle.',
        errorCode: result.integrationStatus || 'APPEEARS_BUNDLE_ERROR',
        details: result.details || null
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'NASA AppEEARS completed task results bundle retrieved.',
      data: result
    });
  } catch (err) {
    next(err);
  }
}
