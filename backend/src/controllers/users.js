import { users, CURRENT_USER } from '../data/mockUsers.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getIndex = asyncHandler(async (req, res, next) => {
    // 1. Example of an explicit 404 trigger if resource missing
    if (!users || users.length === 0) {
        throw new AppError('No users found', 404);
    }

    // 2. Predictable JSON response structure: { success, data, error }
    res.status(200).json({
        success: true,
        data: {
            users,
            CURRENT_USER
        },
        error: null
    });
});

export const getUserById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = users.find(u => u.id === id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.status(200).json({
        success: true,
        data: user,
        error: null
    });
});

export const createUser = asyncHandler(async (req, res, next) => {
    // The request is already validated securely by 'validate' middleware before it hits the controller.
    const newUser = req.body;

    // Simulate DB insertion
    const created = { id: `usr_${Date.now()}`, ...newUser };
    users.push(created);

    res.status(201).json({
        success: true,
        data: created,
        error: null
    });
});
