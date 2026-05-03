import express from 'express';
import * as unifiedController from '../controllers/unified.controller.js';
import { protect } from '../middleware/auth.js';
import { orgScope } from '../middleware/orgScope.js';

const router = express.Router();
// Protect and scope to org — req.orgId is required by costService
router.get('/', protect, orgScope, unifiedController.getIndex);

export default router;
