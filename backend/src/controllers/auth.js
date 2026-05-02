import User from '../models/User.js';
import Team from '../models/Team.js';
import jwt from 'jsonwebtoken';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

const signToken = (id) => {
    // Falls back to a default secret for dev if not provided
    return jwt.sign({ id }, process.env.JWT_SECRET || 'super-secret-dev-key', {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        success: true,
        token,
        data: {
            user
        }
    });
};

export const register = catchAsync(async (req, res, next) => {
    const { name, email, password, teamName } = req.body;

    // 1. Validate required fields upfront
    if (!name || !email || !password) {
        return next(new AppError('Name, email, and password are required.', 400, 'MISSING_FIELDS'));
    }

    // 2. Check for existing user before creating (graceful duplicate handling)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('An account with this email already exists. Please log in instead.', 409, 'DUPLICATE_EMAIL'));
    }

    // 3. Create a dummy team if teamName is provided (or just a default team)
    const newTeam = await Team.create({
        name: teamName || `${name}'s Team`,
        ownerId: '000000000000000000000000' // temporary dummy, will update after user is created
    });

    // 4. Create user
    const newUser = await User.create({
        name,
        email,
        password,
        teamId: newTeam._id,
        role: 'super_admin'
    });

    // 5. Update team owner
    newTeam.ownerId = newUser._id;
    await newTeam.save();

    createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1. Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password.', 400, 'MISSING_FIELDS'));
    }

    // 2. Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Incorrect email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    // 3. If everything ok, send token to client
    createSendToken(user, 200, res);
});

export const getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new AppError('User account no longer exists.', 404, 'USER_NOT_FOUND'));
    }

    res.status(200).json({
        success: true,
        data: {
            user
        }
    });
});
