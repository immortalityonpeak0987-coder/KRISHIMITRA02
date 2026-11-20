/**
 * Routes for Dedicated NASA CMR Endpoints
 * 
 * Supporting standard endpoints and dual-mount compatibility (/api and /api/v1)
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { Router } from 'express';
import {
  getStatus,
  getCollections,
  getGranules
} from '../controllers/cmr.controller.js';

const router = Router();

// Operational capability
router.get('/status', getStatus);
router.get('/', getStatus);

// Collection discovery
router.get('/collections', getCollections);
router.get('/search', getCollections); // Alias for consistency

// Granule discovery
router.get('/granules', getGranules);

export default router;
