/**
 * Integration tests for POST /api/v1/auth/register and POST /api/v1/auth/login.
 *
 * These tests use supertest against the Express app directly (no real DB).
 * Mongoose and bcrypt are mocked so tests run without MongoDB.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ─── Mock env before any app imports ───────────────────────────────────────
vi.mock('../src/config/env.js', () => ({
    env: {
        nodeEnv: 'test',
        port: 4001,
        mongoUri: 'mongodb://localhost/test',
        clientUrl: 'http://localhost:5173',
        serverUrl: 'http://localhost:4001',
        jwtSecret: 'test-secret-32-chars-minimum-len',
        jwtExpiresIn: '7d',
        credentialsEncryptionKey: 'a'.repeat(64),
        betterAuthSecret: 'test-better-auth-secret',
        resendApiKey: null,
        s3BucketName: null,
        awsRegion: 'us-east-1',
    },
}));

vi.mock('mongoose', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        default: {
            ...actual.default,
            startSession: vi.fn().mockResolvedValue({
                withTransaction: vi.fn(async (fn) => fn()),
                endSession: vi.fn(),
            }),
            connection: { readyState: 1 },
            Types: actual.default.Types,
        },
    };
});

vi.mock('../src/models/User.js', () => ({
    default: {
        findOne: vi.fn(),
        create: vi.fn(),
        findById: vi.fn(),
    },
}));

vi.mock('../src/models/Team.js', () => ({
    default: {
        create: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

vi.mock('../src/utils/logger.js', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import app from '../src/app.js';
import User from '../src/models/User.js';
import Team from '../src/models/Team.js';

const mockUserId = '507f1f77bcf86cd799439011';
const mockTeamId = '507f1f77bcf86cd799439012';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('POST /api/v1/auth/register', () => {
    it('returns 400 when required fields are missing', async () => {
        const res = await request(app).post('/api/v1/auth/register').send({ email: 'test@example.com' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errorCode).toBe('MISSING_FIELDS');
    });

    it('returns 409 when email already exists', async () => {
        User.findOne.mockResolvedValue({ _id: mockUserId, email: 'existing@example.com' });

        const res = await request(app).post('/api/v1/auth/register').send({
            name: 'Jane Doe',
            email: 'existing@example.com',
            password: 'password123',
        });

        expect(res.status).toBe(409);
        expect(res.body.errorCode).toBe('DUPLICATE_EMAIL');
    });

    it('returns 201 with token on successful registration', async () => {
        User.findOne.mockResolvedValue(null);
        Team.create.mockResolvedValue([{ _id: mockTeamId }]);
        User.create.mockResolvedValue([{
            _id: mockUserId,
            name: 'John Doe',
            email: 'new@example.com',
            role: 'super_admin',
            teamId: mockTeamId,
            toObject: () => ({ _id: mockUserId, name: 'John Doe', email: 'new@example.com' }),
        }]);
        Team.findByIdAndUpdate.mockResolvedValue({});

        const res = await request(app).post('/api/v1/auth/register').send({
            name: 'John Doe',
            email: 'new@example.com',
            password: 'password123',
        });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
    });
});

describe('POST /api/v1/auth/login', () => {
    it('returns 400 when credentials are missing', async () => {
        const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@example.com' });
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe('MISSING_FIELDS');
    });

    it('returns 401 for wrong credentials', async () => {
        const mockUser = { _id: mockUserId, comparePassword: vi.fn().mockResolvedValue(false) };
        User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(mockUser) });

        const res = await request(app).post('/api/v1/auth/login').send({
            email: 'test@example.com',
            password: 'wrongpassword',
        });

        expect(res.status).toBe(401);
        expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('returns 200 with token on valid credentials', async () => {
        const mockUser = {
            _id: mockUserId,
            name: 'John',
            email: 'john@example.com',
            role: 'super_admin',
            comparePassword: vi.fn().mockResolvedValue(true),
        };
        User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(mockUser) });

        const res = await request(app).post('/api/v1/auth/login').send({
            email: 'john@example.com',
            password: 'correctpassword',
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
    });
});
