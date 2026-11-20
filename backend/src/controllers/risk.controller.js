import { RiskAssessmentService } from '../services/risk/riskAssessmentService.js';
import { RiskAssessment } from '../models/RiskAssessment.js';
import { successResponse, errorResponse } from '../utils/response.js';
import mongoose from 'mongoose';

export async function getFarmRisks(req, res, next) {
  try {
    const { farmId } = req.params;
    const result = await RiskAssessmentService.assessFarm(farmId, req.query);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function assessFarmRisks(req, res, next) {
  try {
    const { farmId } = req.params;
    const result = await RiskAssessmentService.assessFarm(farmId, req.body);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getFarmRiskHistory(req, res, next) {
  try {
    const { farmId } = req.params;
    let history = [];

    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(farmId)) {
      try {
        history = await RiskAssessment.find({ farm: farmId }).sort({ assessmentDate: -1 }).limit(20).lean();
      } catch {
        history = [];
      }
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Historical agricultural risk assessments retrieved.',
      data: {
        farmId,
        count: history.length,
        history
      }
    });
  } catch (err) {
    next(err);
  }
}
