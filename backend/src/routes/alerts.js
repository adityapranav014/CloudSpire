import express from 'express';
import * as alertsController from '../controllers/alerts.js';

const router = express.Router();
router.get('/', alertsController.getIndex);
router.put('/:id', alertsController.updateAnomaly);

export default router;
