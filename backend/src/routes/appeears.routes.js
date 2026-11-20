/**
 * Routes for Dedicated NASA AppEEARS Endpoints
 * 
 * Supporting standard endpoints and dual-mount compatibility (/api and /api/v1)
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { Router } from 'express';
import {
  getStatus,
  getProducts,
  submitTask,
  getTaskStatus,
  getTaskResults
} from '../controllers/appeears.controller.js';

const router = Router();

// Operational capability, Earthdata credentials check
router.get('/status', getStatus);
router.get('/', getStatus);

// Product catalog (live AppEEARS API /product with local fallback)
router.get('/products', getProducts);

// Task submission
router.post('/tasks', submitTask);

// Task status monitoring
router.get('/tasks/:taskId', getTaskStatus);

// Task results / output bundle retrieval (supports both /results and /data)
router.get('/tasks/:taskId/results', getTaskResults);
router.get('/tasks/:taskId/data', getTaskResults);

export default router;
