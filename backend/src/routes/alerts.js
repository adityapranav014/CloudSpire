import express from 'express';
import * as alertsController from '../controllers/alerts.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.get('/', protect, alertsController.getIndex);
router.put('/:id', protect, alertsController.updateAnomaly);

export default router;
