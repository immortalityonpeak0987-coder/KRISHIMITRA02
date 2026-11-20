import { Router } from 'express';
import { getCropsCatalog, getCropById, getCropCalendar } from '../controllers/crop.controller.js';

const router = Router();

router.get('/', getCropsCatalog);
router.get('/calendar', getCropCalendar);
router.get('/:cropId', getCropById);

export default router;
