import { Router } from 'express';
import { getReports, triggerReportGeneration } from '../controllers/reports.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getReports);
router.post('/generate', protect, triggerReportGeneration);

export default router;