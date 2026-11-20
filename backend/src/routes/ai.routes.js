import { Router } from 'express';
import {
  generateSmartAdvisory,
  diagnoseFieldPhoto,
  generateActionPlan,
  chatWithKisanSahayak,
  analyzeSimulation,
  generateCropRotationPlan
} from '../controllers/ai.controller.js';

const router = Router();

router.post('/advisory', generateSmartAdvisory);
router.post('/diagnose', diagnoseFieldPhoto);
router.post('/plan', generateActionPlan);
router.post('/chat', chatWithKisanSahayak);
router.post('/simulate', analyzeSimulation);
router.post('/rotation', generateCropRotationPlan);

export default router;
