import express from 'express';
import * as cloudController from '../controllers/cloud.controller.js';
import { protect } from '../middleware/auth.js';
import { orgScope } from '../middleware/orgScope.js';
import { authorize, WRITE_ROLES } from '../middleware/rbac.js';

const router = express.Router();

// GET /cloud/* — all authenticated roles can read cloud account data
router.get('/aws',   protect, orgScope, cloudController.getAws);
router.get('/azure', protect, orgScope, cloudController.getAzure);
router.get('/gcp',   protect, orgScope, cloudController.getGcp);

// Cloud Accounts CRUD
router.get('/', protect, orgScope, cloudController.getCloudAccounts);
router.post('/connect', protect, orgScope, authorize(...WRITE_ROLES), cloudController.connectCloudAccount);
router.delete('/:id', protect, orgScope, authorize('super_admin', 'finops_manager'), cloudController.deleteCloudAccount);

export default router;
