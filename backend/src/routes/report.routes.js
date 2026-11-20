import { Router } from 'express';
import { generateReport, listReports, getReport, downloadReport, deleteReport } from '../controllers/report.controller.js';

const router = Router();

router.post('/generate', generateReport);
router.get('/', listReports);
router.get('/:reportId', getReport);
router.get('/:reportId/download', downloadReport);
router.delete('/:reportId', deleteReport);

export default router;
