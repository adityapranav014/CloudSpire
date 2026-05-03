import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    keyHash: { type: String, required: true },
    prefix: { type: String, required: true }, // e.g., 'cs_live_123...'
    lastUsedAt: { type: Date },
    expiresAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('ApiKey', apiKeySchema);