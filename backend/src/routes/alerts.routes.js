import express from 'express';
import * as alertsController from '../controllers/alerts.controller.js';
import { protect } from '../middleware/auth.js';
import { orgScope } from '../middleware/orgScope.js';
import { authorize, WRITE_ROLES } from '../middleware/rbac.js';

const router = express.Router();

// GET /alerts — all authenticated roles can view alerts
// Spec: GET /alerts → all authenticated roles
router.get('/', protect, orgScope, alertsController.getIndex);

// PUT /alerts/:id — only admins and managers can mutate alert records
// Spec: POST /alerts → admin, manager only (mutation = write role)
router.put('/:id', protect, orgScope, authorize(...WRITE_ROLES), alertsController.updateAnomaly);

export default router;
