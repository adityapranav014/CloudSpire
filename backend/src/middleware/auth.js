import jwt from 'jsonwebtoken';
import { catchAsync } from './asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { COOKIE_NAME } from '../services/authService.js';

/**
 * protect — verifies the JWT from the httpOnly cookie and injects req.user.
 *
 * Token source priority:
 *   1. req.cookies[COOKIE_NAME]  — standard browser flow (httpOnly cookie)
 *   2. Authorization: Bearer ...  — kept as fallback for API clients / mobile
 *      apps that cannot use cookies (e.g. Postman testing, future public API).
 *
 * Since the JWT payload includes { id, orgId, teamId, role } (set in Task 1),
 * we do NOT hit the database on every request. The token IS the identity.
 *
 * Trade-off: role changes / deactivations take effect at token expiry (7d).
 * Mitigation: use short-lived tokens in production (15m access + refresh flow).
 * A Redis blacklist will be added in Sprint 3 when the refresh token flow ships.
 */
export const protect = catchAsync(async (req, res, next) => {
    // 1. Cookie (primary — browser clients)
    let token = req.cookies?.[COOKIE_NAME];

    // 2. Bearer header (fallback — API clients / Postman)
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(
            new AppError('You are not logged in. Please log in to get access.', 401, 'NO_TOKEN')
        );
    }

    let decoded;
    try {
        decoded = jwt.verify(token, env.jwtSecret);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(
                new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED')
            );
        }
        return next(
            new AppError('Invalid authentication token. Please log in again.', 401, 'INVALID_TOKEN')
        );
    }

    // Attach minimal identity — consistent shape for all downstream handlers
    req.user = {
        id: decoded.id,
        orgId: decoded.orgId,
        teamId: decoded.teamId,
        role: decoded.role,
    };

    next();
});

/**
 * restrictTo — RBAC gate. Always used after protect.
 *
 * Usage:
 *   router.delete('/teams/:id', protect, restrictTo('super_admin'), handler)
 */
export const restrictTo = (...roles) => {
    return (req, _res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action.',
                    403,
                    'FORBIDDEN'
                )
            );
        }
        next();
    };
};
