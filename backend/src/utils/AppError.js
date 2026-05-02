/**
 * Custom operational error class for the CloudSpire API.
 *
 * All errors thrown with this class are "expected" errors — they represent
 * known failure states (validation, auth, not-found) that the client can
 * act on.  The centralized error handler will serialize them into the
 * standard envelope `{ success, data, error, errorCode }`.
 */
export class AppError extends Error {
    /**
     * @param {string} message   Human-readable error description
     * @param {number} statusCode HTTP status code (4xx / 5xx)
     * @param {string} [errorCode] Machine-readable code the frontend can switch on
     */
    constructor(message, statusCode, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.errorCode = errorCode || null;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}
