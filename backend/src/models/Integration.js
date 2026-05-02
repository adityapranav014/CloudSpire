import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    provider: { type: String, enum: ['slack', 'msteams', 'jira', 'pagerduty', 'webhook'], required: true },
    name: { type: String, required: true },
    config: {
        webhookUrl: String,
        apiKey: String,
        channel: String,
        projectKey: String
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Integration', integrationSchema);
