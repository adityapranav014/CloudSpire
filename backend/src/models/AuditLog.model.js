import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, could be an API key action
    action: { type: String, required: true },
    category: { type: String, enum: ['optimization', 'settings', 'cloud', 'team', 'auth', 'api_key'], required: true },
    details: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);