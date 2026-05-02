/**
 * Unit tests for the protect middleware.
 * Verifies token extraction, verification, and user lookup behaviour.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../src/config/env.js', () => ({
    env: {
        nodeEnv: 'test',
        jwtSecret: 'test-secret-32-chars-minimum-len',
        jwtExpiresIn: '7d',
        credentialsEncryptionKey: 'a'.repeat(64),
    },
}));

vi.mock('../src/models/User.js', () => ({
    default: { findById: vi.fn() },
}));

vi.mock('../src/utils/logger.js', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { protect } from '../src/middleware/auth.js';
import User from '../src/models/User.js';

const SECRET = 'test-secret-32-chars-minimum-len';
const mockUserId = '507f1f77bcf86cd799439011';

const makeReqResMock = (token) => {
    const req = {
        headers: token ? { authorization: `Bearer ${token}` } : {},
    };
    const res = {};
    const next = vi.fn();
    return { req, res, next };
};

beforeEach(() => vi.clearAllMocks());

describe('protect middleware', () => {
    it('calls next(AppError 401) when no token is provided', async () => {
        const { req, res, next } = makeReqResMock(null);
        await protect(req, res, next);
        expect(next).toHaveBeenCalledOnce();
        expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    it('calls next(AppError 401) when token is malformed', async () => {
        const { req, res, next } = makeReqResMock('not.a.valid.token');
        await protect(req, res, next);
        expect(next).toHaveBeenCalledOnce();
        expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    it('calls next(AppError 401) when token is expired', async () => {
        const expiredToken = jwt.sign({ id: mockUserId }, SECRET, { expiresIn: -1 });
        const { req, res, next } = makeReqResMock(expiredToken);
        await protect(req, res, next);
        expect(next).toHaveBeenCalledOnce();
        expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    it('calls next(AppError 401) when user no longer exists in DB', async () => {
        const token = jwt.sign({ id: mockUserId }, SECRET, { expiresIn: '1h' });
        User.findById.mockResolvedValue(null);
        const { req, res, next } = makeReqResMock(token);
        await protect(req, res, next);
        expect(next).toHaveBeenCalledOnce();
        expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    it('attaches user to req and calls next() with no error for valid token', async () => {
        const token = jwt.sign({ id: mockUserId }, SECRET, { expiresIn: '1h' });
        const mockUser = { _id: mockUserId, name: 'John', role: 'admin', teamId: 'team1' };
        User.findById.mockResolvedValue(mockUser);
        const { req, res, next } = makeReqResMock(token);
        await protect(req, res, next);
        expect(next).toHaveBeenCalledWith(); // called with no args = success
        expect(req.user).toEqual(mockUser);
    });
});
