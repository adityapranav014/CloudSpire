import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    budget: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Team', teamSchema);
