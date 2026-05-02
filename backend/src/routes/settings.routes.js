import express from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, settingsController.getSettings);
router.post('/integrations/connect', protect, settingsController.connectIntegration);
router.get('/api-keys', protect, settingsController.getApiKeys);
router.post('/api-keys', protect, settingsController.createApiKey);
router.delete('/api-keys/:id', protect, settingsController.deleteApiKey);

export default router;