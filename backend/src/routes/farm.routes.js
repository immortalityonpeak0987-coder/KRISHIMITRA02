import { Router } from 'express';
import {
  getAllFarms,
  getFarmById,
  createFarm,
  updateFarm,
  deleteFarm,
  logFieldObservation,
  updateFarmChecklist,
  logFieldVisit,
  submitSoilTest
} from '../controllers/farm.controller.js';

const router = Router();

router.get('/', getAllFarms);
router.post('/', createFarm);
router.get('/:farmId', getFarmById);
router.put('/:farmId', updateFarm);
router.delete('/:farmId', deleteFarm);
router.post('/:farmId/observations', logFieldObservation);
router.put('/:farmId/checklist', updateFarmChecklist);
router.post('/:farmId/field-visits', logFieldVisit);
router.post('/:farmId/soil-tests', submitSoilTest);

export default router;
