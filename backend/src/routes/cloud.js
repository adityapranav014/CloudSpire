import express from 'express';
import * as cloudController from '../controllers/cloud.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/aws', cloudController.getAws);
router.get('/azure', cloudController.getAzure);
router.get('/gcp', cloudController.getGcp);

// Secure the connect route
router.post('/connect', protect, cloudController.connectCloudAccount);

export default router;
