import express from 'express';
import { register, login, getMe, logout, refreshToken, completeOnboarding } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/refresh', protect, refreshToken);
router.patch('/complete-onboarding', protect, completeOnboarding);

export default router;
