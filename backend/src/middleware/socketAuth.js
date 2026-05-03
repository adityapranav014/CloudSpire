import jwt from 'jsonwebtoken';
import { parse as parseCookies } from 'cookie';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { COOKIE_NAME } from '../services/authService.js';

/**
 * socketAuth — Socket.IO middleware that mirrors the HTTP protect middleware.
 *
 * Token source priority (same logic as HTTP protect):
 *   1. httpOnly cookie (browser clients — Task 2 cookie flow)
 *      Socket.IO sends cookies in the initial HTTP handshake request.
 *      We parse them from socket.handshake.headers.cookie.
 *   2. socket.handshake.auth.token — API clients / Postman / mobile
 *      (preserves the Bearer fallback we kept in Task 2)
 *
 * On success: attaches socket.data = { userId, orgId, teamId, role }
 * On failure: calls next(Error) → Socket.IO rejects the connection
 *
 * No DB lookup — identity comes from the JWT payload (Task 1 decision).
 * Role changes take effect at token expiry (7d). Redis blacklist: Sprint 3.
 */
export const socketAuth = (socket, next) => {
    try {
        let token;

        // 1. Parse the httpOnly cookie from the HTTP handshake request
        const rawCookies = socket.handshake.headers?.cookie;
        if (rawCookies) {
            const cookies = parseCookies(rawCookies);
            token = cookies[COOKIE_NAME];
        }

        // 2. Fallback: token passed explicitly via socket.handshake.auth
        //    Useful for: Postman Socket.IO client, React Native, CLI tools
        if (!token && socket.handshake.auth?.token) {
            token = socket.handshake.auth.token;
        }

        if (!token) {
            logger.warn({ socketId: socket.id }, 'Socket connection rejected: no token');
            return next(new Error('AUTH_REQUIRED'));
        }

        const decoded = jwt.verify(token, env.jwtSecret);

        if (!decoded.orgId) {
            logger.warn({ socketId: socket.id, userId: decoded.id }, 'Socket connection rejected: token has no orgId');
            return next(new Error('NO_ORG_SCOPE'));
        }

        // Attach identity to socket.data — accessible in all event handlers
        socket.data = {
            userId: decoded.id,
            orgId:  decoded.orgId,
            teamId: decoded.teamId,
            role:   decoded.role,
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            logger.warn({ socketId: socket.id }, 'Socket connection rejected: token expired');
            return next(new Error('TOKEN_EXPIRED'));
        }
        logger.warn({ socketId: socket.id, err: err.message }, 'Socket connection rejected: invalid token');
        next(new Error('INVALID_TOKEN'));
    }
};
