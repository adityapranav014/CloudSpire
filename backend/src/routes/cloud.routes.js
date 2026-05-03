import express from 'express';
import * as cloudController from '../controllers/cloud.controller.js';
import { protect } from '../middleware/auth.js';
import { orgScope } from '../middleware/orgScope.js';

const router = express.Router();

router.get('/aws', protect, orgScope, cloudController.getAws);
router.get('/azure', protect, orgScope, cloudController.getAzure);
router.get('/gcp', protect, orgScope, cloudController.getGcp);
router.post('/connect', protect, orgScope, cloudController.connectCloudAccount);

export default router;
