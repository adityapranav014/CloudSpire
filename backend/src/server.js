import http from 'node:http';

import app from './app.js';
import { connectToDatabase, disconnectFromDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = http.createServer(app);

const startServer = async () => {
    try {
        await connectToDatabase(env.mongoUri);
        logger.info('Successfully connected to MongoDB');
    } catch (error) {
        logger.error({ err: error }, 'Could not connect to MongoDB');
        process.exit(1);
    }

    server.listen(env.port, () => {
        logger.info({ port: env.port }, 'CloudSpire backend listening');
    });
};

const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
        await disconnectFromDatabase();
        process.exit(0);
    });

    setTimeout(() => {
        logger.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 10_000);
};

process.on('SIGINT', () => { void shutdown('SIGINT'); });
process.on('SIGTERM', () => { void shutdown('SIGTERM'); });

process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection — shutting down');
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception — shutting down');
    server.close(() => process.exit(1));
});

startServer().catch((error) => {
    logger.error({ err: error }, 'Fatal: failed to initialize server');
    process.exit(1);
});