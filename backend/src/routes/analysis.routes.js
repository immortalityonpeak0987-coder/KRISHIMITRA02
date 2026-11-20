import { Router } from 'express';
import { getFarmEnvironment } from '../controllers/environment.controller.js';
import { getFarmRisks, assessFarmRisks, getFarmRiskHistory } from '../controllers/risk.controller.js';
import { getRotationRecommendations, simulateClimateScenario, getCropIntelligence, getCropCalendar } from '../controllers/crop.controller.js';
import {
  getClimateByFarmId,
  getSatelliteByFarmId,
  getSoilByFarmId,
  getRecoveryTimeline
} from '../controllers/analysis.controller.js';

const router = Router();

router.get('/:farmId/climate', getClimateByFarmId);
router.get('/:farmId/satellite', getSatelliteByFarmId);
router.get('/:farmId/soil', getSoilByFarmId);
router.get('/:farmId/environment', getFarmEnvironment);
router.get('/:farmId/risks', getFarmRisks);
router.post('/:farmId/risks/assess', assessFarmRisks);
router.get('/:farmId/risks/history', getFarmRiskHistory);
router.get('/:farmId/rotation', getRotationRecommendations);
router.get('/:farmId/crops', getRotationRecommendations);
router.post('/:farmId/simulate', simulateClimateScenario);
router.get('/:farmId/crop-intelligence', getCropIntelligence);
router.get('/:farmId/crop-calendar', getCropCalendar);
router.get('/:farmId/recovery', getRecoveryTimeline);

export default router;
