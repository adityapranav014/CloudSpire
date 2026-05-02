import { Router } from 'express';
import { getSettings } from '../controllers/settings.js';

const router = Router();

router.get('/', getSettings);

export default router;