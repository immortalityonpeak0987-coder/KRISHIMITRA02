import { kisanAiService } from '../services/ai/kisanAiService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function generateSmartAdvisory(req, res) {
  try {
    const { farmContext, pageType, language } = req.body || {};
    const data = await kisanAiService.generateSmartAdvisory({
      farmContext,
      pageType: pageType || 'overview',
      language: language || 'en'
    });
    return successResponse(res, {
      message: 'Smart farm advisory generated successfully.',
      data
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to generate smart farm advisory.',
      errorCode: 'AI_ADVISORY_ERROR'
    });
  }
}

export async function diagnoseFieldPhoto(req, res) {
  try {
    const { farmContext, imageBase64, mimeType, symptomNote, conditionPreset, language } = req.body || {};
    if (!imageBase64 && !conditionPreset && !symptomNote) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Please provide a field photo, a sample preset, or symptom notes for diagnosis.',
        errorCode: 'MISSING_DIAGNOSIS_INPUT'
      });
    }
    const data = await kisanAiService.diagnoseFieldPhoto({
      farmContext,
      imageBase64,
      mimeType,
      symptomNote,
      conditionPreset,
      language: language || 'en'
    });
    return successResponse(res, {
      message: 'Field photo & symptom diagnosis completed.',
      data
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to run photo diagnosis.',
      errorCode: 'AI_DIAGNOSIS_ERROR'
    });
  }
}

export async function generateActionPlan(req, res) {
  try {
    const { farmContext, planType, scenarioParams, language } = req.body || {};
    const data = await kisanAiService.generateActionPlan({
      farmContext,
      planType: planType || 'crop-planner',
      scenarioParams: scenarioParams || {},
      language: language || 'en'
    });
    return successResponse(res, {
      message: 'Smart action plan generated successfully.',
      data
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to generate smart action plan.',
      errorCode: 'AI_PLAN_ERROR'
    });
  }
}

export async function chatWithKisanSahayak(req, res) {
  try {
    const { farmContext, message, history, language } = req.body || {};
    if (!message || !String(message).trim()) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Please enter a question for Kisan Sahayak.',
        errorCode: 'EMPTY_CHAT_MESSAGE'
      });
    }
    const data = await kisanAiService.chatWithKisanSahayak({
      farmContext,
      message: String(message).trim(),
      history: Array.isArray(history) ? history : [],
      language: language || 'en'
    });
    return successResponse(res, {
      message: 'Kisan Sahayak response generated.',
      data
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to get response from Kisan Sahayak.',
      errorCode: 'AI_CHAT_ERROR'
    });
  }
}

export async function analyzeSimulation(req, res) {
  try {
    const { farmContext, simulationType, simulationInputs, language } = req.body || {};
    const data = await kisanAiService.analyzeSimulation({
      farmContext,
      simulationType: simulationType || 'climate',
      simulationInputs: simulationInputs || {},
      language: language || 'en'
    });
    return successResponse(res, {
      message: 'Simulation report generated successfully.',
      data
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to generate simulation report.',
      errorCode: 'AI_SIMULATION_ERROR'
    });
  }
}

export async function generateCropRotationPlan(req, res) {
  try {
    const { farmContext, language } = req.body || {};
    const data = await kisanAiService.generateCropRotationPlan({
      farmContext,
      language: language || 'en'
    });
    return successResponse(res, {
      message: 'Smart crop rotation plan generated successfully.',
      data
    });
  } catch (err) {
    return errorResponse(res, {
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to generate smart crop rotation plan.',
      errorCode: 'AI_ROTATION_ERROR'
    });
  }
}
