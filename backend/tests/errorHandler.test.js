/**
 * Unit tests for AppError and the centralized errorHandler middleware.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/config/env.js', () => ({
    env: { nodeEnv: 'test' },
}));

vi.mock('../src/utils/logger.js', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { AppError } from '../src/utils/AppError.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const makeRes = () => {
    const res = { statusCode: null, body: null };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; return res; };
    return res;
};

describe('AppError', () => {
    it('sets statusCode, isOperational, and errorCode', () => {
        const err = new AppError('Not found', 404, 'NOT_FOUND');
        expect(err.statusCode).toBe(404);
        expect(err.isOperational).toBe(true);
        expect(err.errorCode).toBe('NOT_FOUND');
        expect(err.message).toBe('Not found');
    });

    it('sets status to "fail" for 4xx errors', () => {
        const err = new AppError('Bad request', 400);
        expect(err.status).toBe('fail');
    });

    it('sets status to "error" for 5xx errors', () => {
        const err = new AppError('Server error', 500);
        expect(err.status).toBe('error');
    });
});

describe('errorHandler middleware', () => {
    it('serializes an operational AppError into the standard envelope', () => {
        const err = new AppError('Resource not found', 404, 'NOT_FOUND');
        const req = { id: 'req-1', method: 'GET', originalUrl: '/api/v1/test' };
        const res = makeRes();

        errorHandler(err, req, res, vi.fn());

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Resource not found');
        expect(res.body.errorCode).toBe('NOT_FOUND');
        expect(res.body.data).toBeNull();
    });

    it('returns generic message for non-operational errors', () => {
        const err = new Error('Internal crash');
        const req = { id: 'req-2', method: 'POST', originalUrl: '/api/v1/test' };
        const res = makeRes();

        errorHandler(err, req, res, vi.fn());

        expect(res.statusCode).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Something went wrong on our end. Please try again later.');
    });

    it('transforms a CastError into a 400 with INVALID_ID code', () => {
        const err = { name: 'CastError', value: 'bad-id', path: '_id', kind: 'ObjectId' };
        const req = { id: 'req-3', method: 'GET', originalUrl: '/api/v1/test' };
        const res = makeRes();

        errorHandler(err, req, res, vi.fn());

        expect(res.statusCode).toBe(400);
        expect(res.body.errorCode).toBe('INVALID_ID');
    });

    it('transforms a duplicate key error (code 11000) into 409', () => {
        const err = { code: 11000, keyValue: { email: 'dup@example.com' } };
        const req = { id: 'req-4', method: 'POST', originalUrl: '/api/v1/test' };
        const res = makeRes();

        errorHandler(err, req, res, vi.fn());

        expect(res.statusCode).toBe(409);
        expect(res.body.errorCode).toBe('DUPLICATE_ENTRY');
    });
});
