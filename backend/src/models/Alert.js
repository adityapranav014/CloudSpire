import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
    status: { type: String, enum: ['open', 'acknowledged', 'resolved', 'dismissed'], default: 'open' },
    provider: { type: String, enum: ['aws', 'gcp', 'azure'], required: true },
    resourceId: { type: String, required: true },
    expectedSpend: { type: Number },
    actualSpend: { type: Number },
    dateDetected: { type: Date, default: Date.now },
}, { timestamps: true });

alertSchema.index({ teamId: 1, resourceId: 1, status: 1 });

export default mongoose.model('Alert', alertSchema);
