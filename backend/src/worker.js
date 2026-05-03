/**
 * Standalone worker process for background jobs.
 * Run separately from the HTTP server: `node src/worker.js`
 * This keeps the event loop of the HTTP server free from cron overhead
 * and prevents duplicate job runs when scaling to multiple HTTP instances.
 */
import cron from 'node-cron';
import { connectToDatabase } from './config/database.js';
import { analyzeAnomalies } from './jobs/anomalyDetector.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const startWorker = async () => {
    await connectToDatabase(env.mongoUri);
    logger.info('Worker connected to MongoDB');

    // Run every night at midnight
    cron.schedule('0 0 * * *', async () => {
        logger.info('Cron trigger: anomaly detection');
        await analyzeAnomalies();
    });

    logger.info('Worker started — anomaly detection scheduled at 00:00 daily');
};

startWorker().catch((err) => {
    logger.error({ err }, 'Worker failed to start');
    process.exit(1);
});
