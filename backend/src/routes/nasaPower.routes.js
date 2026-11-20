import { Router } from 'express';
import {
  getFarmData,
  getPointData,
  getProviderStatus
} from '../controllers/nasaPower.controller.js';

const router = Router();

// Provider operational capability and metadata
router.get('/status', getProviderStatus);

// Coordinate-based meteorological point query (no farm record required)
router.get('/point', getPointData);

// Farm-specific environmental query (coordinates resolved from MongoDB Farm document)
router.get('/farms/:farmId', getFarmData);

export default router;
