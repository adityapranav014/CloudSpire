import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'BETTER_AUTH_SECRET'];

for (const envVarName of requiredEnvVars) {
    if (!process.env[envVarName]) {
        throw new Error(`Missing required environment variable: ${envVarName}`);
    }
}

export const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 4000),
    mongoUri: process.env.MONGODB_URI,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    serverUrl: process.env.SERVER_URL || 'http://localhost:4000',
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
};