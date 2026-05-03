import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Cookie name — single source of truth used by both set and clear operations
export const COOKIE_NAME = 'cloudpulse_token';

// Max-age in milliseconds (7 days). Cookie and JWT lifetime must stay in sync.
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Signs a JWT embedding id, orgId, teamId, and role.
 * These fields in the payload mean downstream middleware can skip a DB lookup
 * on every authenticated request.
 */
export const signToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            orgId: user.orgId,
            teamId: user.teamId,
            role: user.role,
        },
        env.jwtSecret,
        { expiresIn: '7d' } // Must match COOKIE_MAX_AGE_MS
    );
};

/**
 * Issues a JWT, sets it as an httpOnly cookie, and sends the response.
 *
 * Hybrid approach for both same-domain and cross-domain deployments:
 * - httpOnly cookie: preferred, secure against XSS
 * - Response token: fallback for cross-domain requests (vercel frontend → onrender backend)
 *
 * Cookie flags:
 *   httpOnly  — JavaScript cannot read this cookie (blocks XSS token theft)
 *   secure    — HTTPS only in production (false in dev so localhost works)
 *   sameSite  — 'lax' allows cross-site top-level navigation (safe for deployments)
 *   maxAge    — 7 days, matching the JWT expiry
 *
 * Frontend uses cookie if available (same-domain), falls back to bearer token if not.
 */
export const createSendToken = (user, statusCode, res) => {
    const token = signToken(user);

    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE_MS,
        path: '/',
    });

    const userPublic = user.toPublic ? user.toPublic() : { _id: user._id };

    res.status(statusCode).json({
        success: true,
        // Token in body as fallback for cross-domain deployments where httpOnly cookie won't work
        token,
        data: { user: userPublic },
    });
};

/**
 * Clears the auth cookie. Called by the logout controller.
 * Must use the same options as the set call (path, sameSite, secure) so
 * the browser recognises it as the same cookie to delete.
 */
export const clearAuthCookie = (res) => {
    res.cookie(COOKIE_NAME, '', {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 0,  // Expire immediately
        path: '/',
    });
};

// Export for frontend usage in interceptors
export const COOKIE_MAX_AGE_DAYS = 7;
