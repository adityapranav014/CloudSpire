import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { env } from "./env.js";

const client = new MongoClient(env.mongoUri);
await client.connect().catch((err) => {
    console.error('Warning: Better Auth could not connect to MongoDB:', err.message);
});
const db = client.db();

export const auth = betterAuth({
    secret: env.betterAuthSecret,
    database: mongodbAdapter(db),
    baseURL: env.serverUrl,
    basePath: "/api/auth",
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
        microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        },
    },
    trustedOrigins: [env.clientUrl],
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
});

