import mongoose from 'mongoose';

const cloudAccountSchema = new mongoose.Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    provider: { type: String, enum: ['aws', 'gcp', 'azure'], required: true },
    accountId: { type: String, required: true }, // e.g., AWS Account ID or GCP Project ID
    name: { type: String, required: true },
    credentials: { // Consider encrypting this in a real scenario
        accessKey: String,
        secretKey: String,
        tenantId: String,
        clientId: String,
        clientSecret: String,
        subscriptionId: String,
        serviceAccountJson: String
    },
    status: { type: String, enum: ['active', 'error', 'syncing'], default: 'active' },
    lastSync: { type: Date }
}, { timestamps: true });

export default mongoose.model('CloudAccount', cloudAccountSchema);
