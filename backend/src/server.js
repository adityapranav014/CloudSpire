import http from 'node:http';

import app from './app.js';
import { connectToDatabase, disconnectFromDatabase } from './config/database.js';
import { env } from './config/env.js';

const server = http.createServer(app);

const startServer = async () => {
    try {
        await connectToDatabase(env.mongoUri);
        console.log('Successfully connected to MongoDB');
    } catch (error) {
        console.error('Warning: Could not connect to MongoDB. Some features may be unavailable.', error.message);
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
};

process.on('SIGINT', () => {
    void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});

startServer().catch((error) => {
    console.error('Fatal: Failed to initialize server bootstrap', error);
    process.exit(1);
});