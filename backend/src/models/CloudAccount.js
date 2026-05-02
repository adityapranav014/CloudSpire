import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

const ALGO = 'aes-256-gcm';
// Key must be exactly 32 bytes — store CREDENTIALS_ENCRYPTION_KEY as 64 hex chars in .env
const getKey = () => Buffer.from(env.credentialsEncryptionKey, 'hex');

const SENSITIVE_FIELDS = ['secretKey', 'clientSecret', 'serviceAccountJson'];

function encrypt(text) {
    if (!text) return text;
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGO, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(text) {
    if (!text) return text;
    const parts = text.split(':');
    if (parts.length !== 3) return text; // not encrypted (migration safety)
    try {
        const iv = Buffer.from(parts[0], 'hex');
        const tag = Buffer.from(parts[1], 'hex');
        const encrypted = Buffer.from(parts[2], 'hex');
        const decipher = createDecipheriv(ALGO, getKey(), iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    } catch {
        return text; // return as-is if decryption fails (e.g. corrupted data)
    }
}

const cloudAccountSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Org',
        required: [true, 'CloudAccount must belong to an organisation.'],
    },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    provider: { type: String, enum: ['aws', 'gcp', 'azure'], required: true },
    accountId: { type: String, required: true },
    name: { type: String, required: true },
    credentials: {
        accessKey: String,
        secretKey: String,
        tenantId: String,
        clientId: String,
        clientSecret: String,
        subscriptionId: String,
        serviceAccountJson: String,
    },
    status: { type: String, enum: ['active', 'error', 'syncing'], default: 'active' },
    lastSync: { type: Date },
}, { timestamps: true });

// Unique per org + provider + accountId (an account can only be connected once per org)
cloudAccountSchema.index({ orgId: 1, teamId: 1, provider: 1, accountId: 1 }, { unique: true });

// Encrypt sensitive credential fields before persisting
cloudAccountSchema.pre('save', function (next) {
    for (const field of SENSITIVE_FIELDS) {
        if (this.isModified(`credentials.${field}`) && this.credentials?.[field]) {
            this.credentials[field] = encrypt(this.credentials[field]);
        }
    }
    next();
});

// Decrypt sensitive credential fields after loading from DB
cloudAccountSchema.post('init', function () {
    for (const field of SENSITIVE_FIELDS) {
        if (this.credentials?.[field]) {
            this.credentials[field] = decrypt(this.credentials[field]);
        }
    }
});

export default mongoose.model('CloudAccount', cloudAccountSchema);
