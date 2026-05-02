import express from 'express';
import * as alertsController from '../controllers/alerts.controller.js';

const router = express.Router();
router.get('/', alertsController.getIndex);
router.put('/:id', alertsController.updateAnomaly);

export default router;
