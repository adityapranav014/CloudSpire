import crypto from 'node:crypto';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/AppError.js';

const app = express();

// Security headers
app.use(helmet());

app.use(
    cors({
        origin: env.clientUrl,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Request ID — attach before any logging so all logs can reference it
app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader('x-request-id', req.id);
    next();
});

app.use(express.json());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/health', (_request, response) => {
    const dbReady = mongoose.connection.readyState === 1;
    if (!dbReady) {
        return response.status(503).json({ status: 'unavailable', service: 'cloudspire-backend' });
    }
    response.status(200).json({ status: 'ok', service: 'cloudspire-backend' });
});

app.use('/api/v1', apiRouter);

// Handle 404
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Centralized error handling
app.use(errorHandler);

export default app;