import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

/* ─── Mongoose / MongoDB error transformers ─── */

/**
 * Mongoose CastError — e.g. invalid ObjectId format.
 */
const handleCastError = (err) => {
    const message = `Invalid value "${err.value}" for field "${err.path}". Please provide a valid ${err.kind || 'value'}.`;
    return new AppError(message, 400, 'INVALID_ID');
};

/**
 * Mongoose ValidationError — one or more fields failed schema validation.
 */
const handleValidationError = (err) => {
    const messages = Object.values(err.errors).map((e) => e.message);
    const message = `Validation failed: ${messages.join('. ')}`;
    return new AppError(message, 400, 'VALIDATION_ERROR');
};

/**
 * MongoDB duplicate key error (code 11000).
 */
const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field] || 'unknown';
    const message = `A record with ${field} "${value}" already exists. Please use a different value.`;
    return new AppError(message, 409, 'DUPLICATE_ENTRY');
};

/* ─── JWT error transformers ─── */

const handleJWTError = () =>
    new AppError('Invalid authentication token. Please log in again.', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
    new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED');

/* ─── JSON parse error ─── */

const handleSyntaxError = () =>
    new AppError('Malformed request body. Please send valid JSON.', 400, 'MALFORMED_JSON');

/* ─── Centralized error handler middleware ─── */

export const errorHandler = (err, req, res, _next) => {
    // Default to 500 if nothing is set
    err.statusCode = err.statusCode || 500;

    // Clone to avoid mutating the original
    let error = { ...err, message: err.message, name: err.name };

    // ── Transform known error types into operational AppErrors ──
    if (error.name === 'CastError') error = handleCastError(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.code === 11000) error = handleDuplicateKeyError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'SyntaxError' && error.type === 'entity.parse.failed') error = handleSyntaxError();

    // ── Determine final status code ──
    const statusCode = error.statusCode || err.statusCode || 500;

    // ── Log server errors (never swallow 5xx) ──
    if (statusCode >= 500) {
        logger.error({ err, reqId: req.id, method: req.method, url: req.originalUrl }, err.message);
    }

    // ── Build standardized API envelope ──
    const response = {
        success: false,
        data: null,
        error: error.isOperational
            ? error.message
            : 'Something went wrong on our end. Please try again later.',
        errorCode: error.errorCode || 'INTERNAL_ERROR',
    };

    // Attach stack trace in development only
    if (env.nodeEnv === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};
