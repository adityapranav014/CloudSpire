import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { catchAsync } from './asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export const protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401, 'NO_TOKEN'));
    }

    let decoded;
    try {
        decoded = jwt.verify(token, env.jwtSecret);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
        }
        return next(new AppError('Invalid authentication token. Please log in again.', 401, 'INVALID_TOKEN'));
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    req.user = currentUser;
    next();
});

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
        }
        next();
    };
};
