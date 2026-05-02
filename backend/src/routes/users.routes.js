import express from 'express';
import { z } from 'zod';
import * as usersController from '../controllers/users.controller.js';
import { validate } from '../middleware/validate.js';

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
router.get('/', usersController.getIndex);
router.get('/:id', validate(getUserParamsSchema), usersController.getUserById);
router.post('/', validate(createUserSchema), usersController.createUser);

export default router;
