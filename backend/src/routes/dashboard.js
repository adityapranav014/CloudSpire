import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.js';
import { protect } from '../middleware/auth.js';
import { orgScope } from '../middleware/orgScope.js';

const router = Router();

router.get('/summary', protect, orgScope, getDashboardSummary);

export default router;
