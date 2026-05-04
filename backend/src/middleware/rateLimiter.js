import { AppError } from '../utils/AppError.js';
import rateLimit from 'express-rate-limit';

// ---------------------------------------------------------------------------
// In-Memory Per-User Rate Limiter
//
// Tracks requests per user (via req.user.id) using a sliding window.
// No external dependency required — perfect for hackathons & small deploys.
//
// For production at scale, swap the in-memory Map with a Redis-backed
// counter (e.g. ioredis INCR + EXPIRE).
// ---------------------------------------------------------------------------

/** @type {Map<string, { count: number, resetAt: number }>} */
const buckets = new Map();

// Auto-purge expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}, 5 * 60 * 1000).unref();

/**
 * Creates a rate-limiting middleware scoped per authenticated user.
 *
 * @param {object}  opts
 * @param {number}  opts.windowMs   — time window in milliseconds
 * @param {number}  opts.max        — max requests allowed per window
 * @param {string}  [opts.keyPrefix] — prefix to isolate different limiters
 * @param {string}  [opts.message]  — custom 429 message
 * @returns {import('express').RequestHandler}
 */
export const rateLimiter = ({
    windowMs = 60_000,
    max = 5,
    keyPrefix = 'rl',
    message,
} = {}) => {
    return (req, _res, next) => {
        // Identify by authenticated user — falls back to IP for safety
        const userId = req.user?.id || req.user?._id?.toString() || req.ip;
        const key = `${keyPrefix}:${userId}`;
        const now = Date.now();

        let bucket = buckets.get(key);

        // First request or expired window — reset
        if (!bucket || bucket.resetAt <= now) {
            bucket = { count: 1, resetAt: now + windowMs };
            buckets.set(key, bucket);
            return next();
        }

        bucket.count++;

        if (bucket.count > max) {
            const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);

            return next(
                new AppError(
                    message || `Too many requests. You can generate up to ${max} reports per ${Math.round(windowMs / 60_000)} minute(s). Retry after ${retryAfterSec}s.`,
                    429,
                    'RATE_LIMIT_EXCEEDED',
                ),
            );
        }

        next();
    };
};

// ---------------------------------------------------------------------------
// Pre-built limiters for the report endpoints
// ---------------------------------------------------------------------------

/** PDF generation: max 20 per 5 minutes per user (relaxed for demo). */
export const reportGenerationLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 20,
    keyPrefix: 'report-gen',
    message: 'Report generation rate limit exceeded. Please wait a moment.',
});

/** Status polling: max 60 per minute per user (generous for polling). */
export const reportStatusLimiter = rateLimiter({
    windowMs: 60_000,
    max: 60,
    keyPrefix: 'report-status',
});

/** Download: max 20 per minute per user. */
export const reportDownloadLimiter = rateLimiter({
    windowMs: 60_000,
    max: 20,
    keyPrefix: 'report-dl',
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        error: 'Too many requests, please try again later.',
        errorCode: 'RATE_LIMITED',
    },
});
