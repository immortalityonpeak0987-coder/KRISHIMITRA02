/**
 * Routes for Google Earth Engine REST API Integration Endpoints
 * 
 * Supporting standard endpoints and dual-mount compatibility (/api and /api/v1)
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { Router } from 'express';
import {
  getStatus,
  getConfig,
  getDiscovery
} from '../controllers/earthEngine.controller.js';

const router = Router();

// Provider status, Google Cloud configuration state, and capabilities
router.get('/status', getStatus);
router.get('/', getStatus);

// Technical configuration requirements, scopes, and setup instructions
router.get('/config', getConfig);

// API v1 Discovery document schema summary
router.get('/discovery', getDiscovery);

export default router;
