import http from 'node:http';
import cron from 'node-cron';

import app from './app.js';
import { connectToDatabase, disconnectFromDatabase } from './config/database.js';
import { startReportWorker } from './workers/reportQueueWorker.js';
import { initReportCleanup } from './jobs/reportCleanup.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { analyzeAnomalies } from './jobs/anomalyDetector.js';
import { initSocket } from './services/socketService.js';
import { seedSampleDataIfNeeded } from './services/sampleDataService.js';

const server = http.createServer(app);

const startServer = async () => {
    try {
        await connectToDatabase(env.mongoUri);
        logger.info('Successfully connected to MongoDB');

        // Start BullMQ report worker (requires Redis)
        try {
            const worker = await startReportWorker();
            if (worker) {
                logger.info('BullMQ Report Worker started.');
            }
        } catch (err) {
            logger.warn({ err }, 'BullMQ worker skipped — Redis may be unavailable');
        }

        // Start report file cleanup cron
        initReportCleanup();

        // Seed demo data from AWS CUR sample CSV — runs once, skips if already seeded
        await seedSampleDataIfNeeded();
    } catch (error) {
        logger.error({ err: error }, 'Could not connect to MongoDB');
        process.exit(1);
    }

    // Schedule anomaly detection — every hour, only after DB is ready
    cron.schedule('0 * * * *', () => {
        logger.info('Cron: triggering anomaly detection job');
        analyzeAnomalies().catch(err => logger.error({ err }, 'Anomaly detection job error'));
    });

    // Initialize Socket.io
    initSocket(server);

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