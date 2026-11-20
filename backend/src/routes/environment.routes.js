import { Router } from 'express';
import { getFarmEnvironment } from '../controllers/environment.controller.js';

const router = Router();

router.get('/:farmId', getFarmEnvironment);

export default router;
