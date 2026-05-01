import mongoose from 'mongoose';

export const connectToDatabase = async (mongoUri) => {
    if (!mongoUri) {
        throw new Error('MONGODB_URI is required');
    }

    // Intentionally keep driver pool and timeout settings at defaults until
    // workload and deployment constraints are known.
    await mongoose.connect(mongoUri);
};

export const disconnectFromDatabase = async () => {
    await mongoose.disconnect();
};