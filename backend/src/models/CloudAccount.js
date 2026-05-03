import mongoose from 'mongoose';

const SENSITIVE_FIELDS = ['accessKey', 'secretKey', 'tenantId', 'clientId', 'clientSecret', 'subscriptionId', 'serviceAccountJson'];

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
    if (this.isModified('credentials')) {
        const { encrypt } = require('../services/encryptionService.js');
        
        for (const field of SENSITIVE_FIELDS) {
            if (this.credentials?.[field]) {
                // Ensure it's a string before passing to encrypt
                this.credentials[field] = encrypt(this.credentials[field].toString());
            }
        }
    }
    next();
});

// Instance method to get decrypted credentials safely when needed by services
cloudAccountSchema.methods.getDecryptedCredentials = function () {
    const { decrypt } = require('../services/encryptionService.js');
    const decrypted = {};
    
    if (!this.credentials) return decrypted;
    
    for (const field of SENSITIVE_FIELDS) {
        if (this.credentials[field]) {
            try {
                // check if it looks encrypted (contains ':')
                if (this.credentials[field].includes(':')) {
                    decrypted[field] = decrypt(this.credentials[field]);
                } else {
                    decrypted[field] = this.credentials[field]; // fallback for plaintext if not migrated yet
                }
            } catch (err) {
                decrypted[field] = null; // log but don't crash, prevent returning corrupted ciphertext
            }
        }
    }
    
    return decrypted;
};

export default mongoose.model('CloudAccount', cloudAccountSchema);
