import { EnvironmentalStandardizationService } from '../services/environment/environmentalStandardizationService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function getFarmEnvironment(req, res, next) {
  try {
    const { farmId } = req.params;
    const { startDate, endDate, parameters, aggregation } = req.query;

    const paramList = parameters ? String(parameters).split(',').map(p => p.trim()) : null;

    const data = await EnvironmentalStandardizationService.getFarmEnvironmentalProfile(farmId, {
      startDate,
      endDate,
      parameters: paramList,
      aggregation
    });

    return successResponse(res, {
      statusCode: 200,
      message: 'Standardized environmental observations retrieved successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}
