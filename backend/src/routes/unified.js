import express from 'express';
import * as unifiedController from '../controllers/unified.js';

const router = express.Router();
router.get('/', unifiedController.getIndex);

export default router;
