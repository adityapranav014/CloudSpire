import mongoose from 'mongoose';

/**
 * Optimization — a cost-saving recommendation for a specific cloud resource.
 *
 * orgId is the primary tenant boundary.
 * confidenceScore added here for Sprint 2 (Task: "confidence scores on recommendations").
 */
const optimizationSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Org',
            required: [true, 'Optimization must belong to an organisation.'],
        },
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: [true, 'Optimization must belong to a team.'],
        },
        title: {
            type: String,
            required: [true, 'Title is required.'],
            maxlength: [200, 'Title cannot exceed 200 characters.'],
        },
        description: {
            type: String,
            required: [true, 'Description is required.'],
        },
        type: {
            type: String,
            enum: ['rightsize', 'shutdown', 'reserved-instance', 'cleanup'],
            required: [true, 'Type is required.'],
        },
        provider: {
            type: String,
            enum: ['aws', 'gcp', 'azure'],
            required: [true, 'Provider is required.'],
        },
        resourceId: {
            type: String,
            required: [true, 'Resource ID is required.'],
        },
        potentialSavings: {
            type: Number,
            required: [true, 'Potential savings is required.'],
            min: [0, 'Potential savings cannot be negative.'],
        },
        // Sprint 2: confidence score 0–1 (1 = very confident)
        confidenceScore: {
            type: Number,
            default: null,
            min: 0,
            max: 1,
        },
        status: {
            type: String,
            enum: ['pending', 'implemented', 'ignored'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Primary: org + status (optimizer page pending list)
optimizationSchema.index({ orgId: 1, status: 1 });

// Team-level drilldown
optimizationSchema.index({ orgId: 1, teamId: 1, status: 1 });

// Savings leaderboard sort
optimizationSchema.index({ orgId: 1, potentialSavings: -1 });

export default mongoose.model('Optimization', optimizationSchema);
