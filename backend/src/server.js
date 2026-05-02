import http from 'node:http';

import app from './app.js';
import { connectToDatabase, disconnectFromDatabase } from './config/database.js';
import { initJobs } from './jobs/anomalyDetector.js';
import { env } from './config/env.js';

const server = http.createServer(app);

const startServer = async () => {
    try {
        await connectToDatabase(env.mongoUri);
        console.log('Successfully connected to MongoDB');

        // Initialize background jobs (Anomaly Detection)
        initJobs();
        console.log('Background Cron Jobs Initialized...');
    } catch (error) {
        console.error('Warning: Could not connect to MongoDB. Some features may be unavailable.', error.message);
        process.exit(1); // Force crash if DB fails so user knows exactly what went wrong
    }

    server.listen(env.port, () => {
        console.log(`CloudSpire backend listening on port ${env.port}`);
    });
};

const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down CloudSpire backend.`);

    server.close(async () => {
        await disconnectFromDatabase();
        process.exit(0);
    });

    // Force-exit if graceful shutdown hangs for more than 10 seconds
    setTimeout(() => {
        console.error('Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 10_000);
};

process.on('SIGINT', () => {
    void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});

/* ─── Process-level safety nets ─── */

// Catch unhandled promise rejections so the process doesn't silently hang
process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION! Shutting down...', reason);
    server.close(() => process.exit(1));
});

// Catch synchronous exceptions that bubble past all handlers
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
    server.close(() => process.exit(1));
});

startServer().catch((error) => {
    console.error('Fatal: Failed to initialize server bootstrap', error);
    process.exit(1);
});