/**
 * Routes for NASA Satellite Data Integration Endpoints
 * 
 * Supporting standard endpoints and dual-mount compatibility (/api and /api/v1)
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { Router } from 'express';
import {
  getStatus,
  getProducts,
  searchCmr,
  submitAppeearsTask,
  getAppeearsTaskStatus,
  getAppeearsTaskData
} from '../controllers/satellite.controller.js';

const router = Router();

// Operational capabilities, Earthdata authentication status, and disclaimers
router.get('/status', getStatus);

// Verified product catalog (MODIS, SMAP, GPM IMERG, HLS)
router.get('/products', getProducts);

// NASA CMR collection & granule discovery
router.get('/search', searchCmr);

// AppEEARS task submission (asynchronous point & polygon extraction)
router.post('/tasks', submitAppeearsTask);

// AppEEARS task processing status tracking
router.get('/tasks/:taskId', getAppeearsTaskStatus);

// AppEEARS output bundle retrieval and storage reference listing
router.get('/tasks/:taskId/data', getAppeearsTaskData);

export default router;
