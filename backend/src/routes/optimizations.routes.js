import express from 'express';
import * as optimizationsController from '../controllers/optimizations.controller.js';
import { protect } from '../middleware/auth.js';
import { orgScope } from '../middleware/orgScope.js';
import { authorize, WRITE_ROLES } from '../middleware/rbac.js';

const router = express.Router();

// GET /optimizations — all authenticated roles can view recommendations
router.get('/', protect, orgScope, optimizationsController.getIndex);

// PUT /optimizations/:id — only admins and managers can schedule/act on optimizations
router.put('/:id', protect, orgScope, authorize(...WRITE_ROLES), optimizationsController.updateSchedule);

export default router;
