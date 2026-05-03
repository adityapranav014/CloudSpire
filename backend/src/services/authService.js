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
 * Cookie flags:
 *   httpOnly  — JavaScript cannot read this cookie (blocks XSS token theft)
 *   secure    — HTTPS only in production (false in dev so localhost works)
 *   sameSite  — 'strict' blocks CSRF by refusing cross-site cookie sends
 *   maxAge    — 7 days, matching the JWT expiry
 *
 * The token is NOT returned in the JSON body. The frontend never touches it.
 * If the frontend needs to know the user's identity it calls GET /auth/me.
 */
export const createSendToken = (user, statusCode, res) => {
    const token = signToken(user);

    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE_MS,
        path: '/',
    });

    const userPublic = user.toPublic ? user.toPublic() : { _id: user._id };

    res.status(statusCode).json({
        success: true,
        // Token intentionally omitted from body — it is in the httpOnly cookie
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
        sameSite: 'strict',
        maxAge: 0,  // Expire immediately
        path: '/',
    });
};
