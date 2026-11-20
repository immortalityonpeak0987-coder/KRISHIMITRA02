import { Router } from 'express';
import { getFarmRisks, assessFarmRisks, getFarmRiskHistory } from '../controllers/risk.controller.js';

const router = Router();

router.get('/:farmId', getFarmRisks);
router.post('/:farmId/assess', assessFarmRisks);
router.get('/:farmId/history', getFarmRiskHistory);

export default router;
