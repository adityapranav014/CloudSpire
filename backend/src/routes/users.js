import express from 'express';
import { z } from 'zod';
import * as usersController from '../controllers/users.js';
import { validate } from '../middleware/validate.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Define robust Zod schemas for input validation
const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        role: z.enum(['admin', 'user', 'viewer']).optional().default('user'),
    }),
});

const getUserParamsSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'User ID is required'),
    }),
});

// Routes using middleware wrapper for Async Operations and validations
router.get('/', protect, usersController.getIndex);
router.get('/:id', protect, validate(getUserParamsSchema), usersController.getUserById);
router.post('/', protect, restrictTo('super_admin'), validate(createUserSchema), usersController.createUser);

export default router;
