import express from 'express';
import * as optimizationsController from '../controllers/optimizations.js';

const router = express.Router();
router.get('/', optimizationsController.getIndex);
router.put('/:id', optimizationsController.updateSchedule);

export default router;
