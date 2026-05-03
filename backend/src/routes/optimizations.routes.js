import express from 'express';
import * as optimizationsController from '../controllers/optimizations.controller.js';
import { protect } from '../middleware/auth.js';
import { orgScope } from '../middleware/orgScope.js';

const router = express.Router();

router.get('/', protect, orgScope, optimizationsController.getIndex);
router.put('/:id', protect, orgScope, optimizationsController.updateSchedule);

export default router;
