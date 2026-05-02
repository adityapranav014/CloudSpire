import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (id) => {
    return jwt.sign({ id }, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn,
    });
};

export const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    user.password = undefined;
    res.status(statusCode).json({
        success: true,
        token,
        data: { user },
    });
};
