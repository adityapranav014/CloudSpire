import express from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize, WRITE_ROLES, ADMIN_ONLY } from '../middleware/rbac.js';

const router = express.Router();

// GET /settings — all authenticated roles
router.get('/', protect, settingsController.getSettings);

// POST /settings/integrations/connect — write action (admin/manager only)
router.post('/integrations/connect', protect, authorize(...WRITE_ROLES), settingsController.connectIntegration);

// GET /settings/api-keys — write-role users manage API keys
router.get('/api-keys', protect, authorize(...WRITE_ROLES), settingsController.getApiKeys);

// POST /settings/api-keys — create key (admin/manager only)
router.post('/api-keys', protect, authorize(...WRITE_ROLES), settingsController.createApiKey);

// DELETE /settings/api-keys/:id — delete key (admin only — irreversible)
router.delete('/api-keys/:id', protect, authorize(...ADMIN_ONLY), settingsController.deleteApiKey);

export default router;