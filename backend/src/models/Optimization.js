import mongoose from 'mongoose';

const optimizationSchema = new mongoose.Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['rightsize', 'shutdown', 'reserved-instance', 'cleanup'], required: true },
    provider: { type: String, enum: ['aws', 'gcp', 'azure'], required: true },
    resourceId: { type: String, required: true },
    potentialSavings: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'implemented', 'ignored'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Optimization', optimizationSchema);
