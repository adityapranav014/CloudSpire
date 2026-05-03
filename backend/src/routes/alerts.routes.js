import express from 'express';
import * as alertsController from '../controllers/alerts.controller.js';
import { protect } from '../middleware/auth.js';
import { orgScope } from '../middleware/orgScope.js';

const router = express.Router();

router.get('/', protect, orgScope, alertsController.getIndex);
router.put('/:id', protect, orgScope, alertsController.updateAnomaly);

export default router;
