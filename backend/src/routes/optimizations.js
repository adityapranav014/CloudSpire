import express from 'express';
import * as optimizationsController from '../controllers/optimizations.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, optimizationsController.getIndex);
router.put('/:id', protect, optimizationsController.updateSchedule);

export default router;
