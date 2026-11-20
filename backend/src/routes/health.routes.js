import { Router } from 'express';
import { getHealth, getReadiness } from '../controllers/health.controller.js';

const router = Router();

// Liveness probe endpoint
router.get('/health', getHealth);

// Readiness probe endpoint (checks MongoDB Atlas connectivity)
router.get('/ready', getReadiness);

export default router;
