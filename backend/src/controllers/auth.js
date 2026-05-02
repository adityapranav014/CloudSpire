import mongoose from 'mongoose';
import User from '../models/User.js';
import Team from '../models/Team.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { signToken, createSendToken } from '../services/authService.js';

export const register = catchAsync(async (req, res, next) => {
    const { name, email, password, teamName } = req.body;

    if (!name || !email || !password) {
        return next(new AppError('Name, email, and password are required.', 400, 'MISSING_FIELDS'));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('An account with this email already exists. Please log in instead.', 409, 'DUPLICATE_EMAIL'));
    }

    const session = await mongoose.startSession();
    let newUser;
    try {
        await session.withTransaction(async () => {
            const [newTeam] = await Team.create(
                [{ name: teamName || `${name}'s Team`, ownerId: new mongoose.Types.ObjectId() }],
                { session }
            );

            [newUser] = await User.create(
                [{ name, email, password, teamId: newTeam._id, role: 'super_admin' }],
                { session }
            );

            await Team.findByIdAndUpdate(newTeam._id, { ownerId: newUser._id }, { session });
        });
    } finally {
        session.endSession();
    }

    createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password.', 400, 'MISSING_FIELDS'));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Incorrect email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    createSendToken(user, 200, res);
});

export const getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new AppError('User account no longer exists.', 404, 'USER_NOT_FOUND'));
    }

    res.status(200).json({
        success: true,
        data: { user },
    });
});

export const logout = catchAsync(async (req, res) => {
    // With Bearer-token auth the server cannot invalidate the token — the
    // client is responsible for discarding it. We respond 200 so the frontend
    // can clear state cleanly. A Redis blacklist can be added in Phase 4.
    res.status(200).json({ success: true, data: null });
});

export const refreshToken = catchAsync(async (req, res, next) => {
    // Re-issue a token for the currently authenticated user.
    // The `protect` middleware has already verified the incoming token.
    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) {
        return next(new AppError('User not found or inactive.', 401, 'USER_NOT_FOUND'));
    }
    createSendToken(user, 200, res);
});
