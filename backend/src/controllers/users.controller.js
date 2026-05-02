import User from '../models/User.model.js';
import { catchAsync } from '../middleware/asyncHandler.js'; // fixed import name
import { AppError } from '../utils/AppError.js';

export const getIndex = catchAsync(async (req, res, next) => {
    const users = await User.find();
    if (!users || users.length === 0) {
        throw new AppError('No users found', 404);
    }

    res.status(200).json({
        success: true,
        data: {
            users,
            CURRENT_USER: users[0] || null // temporary mock of logged in user
        },
        error: null
    });
});

export const getUserById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.status(200).json({
        success: true,
        data: user,
        error: null
    });
});

export const createUser = catchAsync(async (req, res, next) => {
    const userPayload = req.body;
    // Set a dummy teamId if not provided for now, until full auth flow exists
    if (!userPayload.teamId) {
        userPayload.teamId = '000000000000000000000000';
    }

    // Hash password with bcrypt in Phase 2
    const created = await User.create(userPayload);

    res.status(201).json({
        success: true,
        data: created,
        error: null
    });
});
