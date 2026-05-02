import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { env } from './config/env.js';
import apiRouter from './routes/index.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/AppError.js';

const app = express();

app.use(
    cors({
        origin: env.clientUrl,
        credentials: true,
    })
);

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

// Handle 404
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Centralized error handling
app.use(errorHandler);

export default app;