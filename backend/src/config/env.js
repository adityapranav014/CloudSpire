import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
    'MONGODB_URI',
    'BETTER_AUTH_SECRET',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
];

for (const envVarName of requiredEnvVars) {
    if (!process.env[envVarName]) {
        console.error(`FATAL: ${envVarName} not set`);
        process.exit(1);
    }
}

export const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 4000),
    mongoUri: process.env.MONGODB_URI,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    serverUrl: process.env.SERVER_URL || 'http://localhost:4000',
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    encryptionKey: process.env.ENCRYPTION_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    s3BucketName: process.env.S3_BUCKET_NAME,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    openRouterApiKey: process.env.OPENROUTER_API_KEY,

    // Azure Configuration
    azure: {
        tenantId: process.env.AZURE_TENANT_ID,
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
    },
};