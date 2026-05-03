import crypto from 'node:crypto';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import apiRouter from './routes/index.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/AppError.js';
import { quickChat } from './controllers/chat.js';
import { protect } from './middleware/auth.js';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
// credentials: true is required for the browser to send httpOnly cookies
// cross-origin. The origin MUST be an exact string (not wildcard) when
// credentials are enabled — wildcards are rejected by the browser spec.
//
// Origins are built from CLIENT_URL, CLIENT_URLS (comma-separated), and
// localhost fallbacks. In production, set CLIENT_URLS in the Render dashboard
// to include the Vercel frontend URL, e.g.:
//   CLIENT_URLS=https://cloudspire-app.vercel.app
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow server-to-server requests with no Origin header (e.g. Render health checks)
            if (!origin) return callback(null, true);
            if (env.clientUrls.includes(origin)) return callback(null, true);
            callback(new Error(`CORS: ${origin} not in allowlist`));
        },
        credentials: true,          // allows browser to send/receive cookies
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Startup log — visible in Render logs to confirm the allowlist loaded correctly
console.info('[CORS] Active origin allowlist:', env.clientUrls);

// ── Cookie parser ─────────────────────────────────────────────────────────────
// Must be registered before any route handler that reads req.cookies.
app.use(cookieParser());

// ── Request ID ────────────────────────────────────────────────────────────────
// Attach before logging so all log lines can reference req.id.
app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader('x-request-id', req.id);
    next();
});

app.use(express.json());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));



// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_request, response) => {
    const dbReady = mongoose.connection.readyState === 1;
    if (!dbReady) {
        return response.status(503).json({ status: 'unavailable', service: 'cloudspire-backend' });
    }
    response.status(200).json({ status: 'ok', service: 'cloudspire-backend' });
});

// ── Simple chat endpoint ──────────────────────────────────────────────────────
// POST /api/chat — simple { message } → { reply } endpoint
app.post('/api/chat', protect, quickChat);

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// ── Centralised error handler ─────────────────────────────────────────────────
app.use(errorHandler);

export default app;