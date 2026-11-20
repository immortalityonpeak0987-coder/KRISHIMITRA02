/**
 * Routes for IMD Environmental Ingestion Endpoints
 * 
 * Supporting standard endpoints and kebab-case aliases
 * An independent submission for Seva First Innovation Challenge – Eastern Region | West Bengal, India
 */

import { Router } from 'express';
import {
  getProviderStatus,
  getCurrentWeather,
  getDistrictRainfall,
  getStateRainfall,
  getAwsData
} from '../controllers/imd.controller.js';

const router = Router();

// Provider operational capability, endpoint availability, and credentials check
router.get('/status', getProviderStatus);

// Current surface weather (/current_wx and /current-weather alias)
router.get('/current_wx', getCurrentWeather);
router.get('/current-weather', getCurrentWeather);

// District-level rainfall (/districtrainfall and /district-rainfall alias)
router.get('/districtrainfall', getDistrictRainfall);
router.get('/district-rainfall', getDistrictRainfall);

// State-level rainfall (/staterainfall and /state-rainfall alias)
router.get('/staterainfall', getStateRainfall);
router.get('/state-rainfall', getStateRainfall);

// AWS/ARG station telemetry (/aws_data and /aws alias)
router.get('/aws_data', getAwsData);
router.get('/aws', getAwsData);

export default router;
