import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    const statusCode = error.statusCode || err.statusCode || 500;

    // Standardized Error Response Formatter
    const response = {
        success: false,
        data: null,
        error: error.message || 'Internal Server Error'
    };

    if (env.nodeEnv === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};
