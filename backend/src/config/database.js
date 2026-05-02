import mongoose from 'mongoose';

export const connectToDatabase = async (mongoUri) => {
    if (!mongoUri) {
        throw new Error('MONGODB_URI is required');
    }

    // Connection options for resilience
    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,   // Fail fast if MongoDB is unreachable (5s instead of 30s default)
        socketTimeoutMS: 45000,           // Close sockets after 45s of inactivity
        maxPoolSize: 10,                  // Default connection pool
    });

    // Log connection events for observability
    mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB] Connection lost. Mongoose will attempt to reconnect.');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('[MongoDB] Successfully reconnected.');
    });

    mongoose.connection.on('error', (err) => {
        console.error('[MongoDB] Connection error:', err.message);
    });
};

export const disconnectFromDatabase = async () => {
    await mongoose.disconnect();
};