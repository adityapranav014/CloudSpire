import mongoose from 'mongoose';

const costRecordSchema = new mongoose.Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    cloudAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'CloudAccount', required: true },
    provider: { type: String, enum: ['aws', 'gcp', 'azure'], required: true },
    date: { type: Date, required: true },
    service: { type: String, required: true },
    region: { type: String, required: true },
    cost: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
}, { timestamps: true });

// Compound index to help queries by team + date + provider
costRecordSchema.index({ teamId: 1, date: -1, provider: 1 });

export default mongoose.model('CostRecord', costRecordSchema);
