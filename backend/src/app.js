import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { env } from './config/env.js';
import apiRouter from './routes/index.js';

import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";

const app = express();

app.use(
    cors({
        origin: env.clientUrl,
        credentials: true,
    })
);

// Better Auth handler must come BEFORE express.json()
app.use("/api/auth", toNodeHandler(auth));

app.use(express.json());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/health', (_request, response) => {
    response.status(200).json({
        status: 'ok',
        service: 'cloudspire-backend',
        environment: env.nodeEnv,
    });
});

app.use('/api/v1', apiRouter);

app.use((_request, response) => {
    response.status(404).json({
        message: 'Route not found',
    });
});

app.use((error, _request, response, _next) => {
    const statusCode = error.statusCode || 500;

    response.status(statusCode).json({
        message: error.message || 'Internal server error',
    });
});

export default app;