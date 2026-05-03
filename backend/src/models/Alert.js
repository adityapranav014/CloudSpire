import mongoose from 'mongoose';

/**
 * Alert — cost anomaly or budget threshold breach.
 *
 * orgId is the primary tenant boundary.
 * aiExplanation is populated by the Gemini integration (Task 8).
 */
const alertSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Org',
            required: [true, 'Alert must belong to an organisation.'],
        },
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: [true, 'Alert must belong to a team.'],
        },
        title: {
            type: String,
            required: [true, 'Alert title is required.'],
            maxlength: [200, 'Title cannot exceed 200 characters.'],
        },
        description: {
            type: String,
            required: [true, 'Alert description is required.'],
        },
        severity: {
            type: String,
            enum: ['critical', 'high', 'medium', 'low'],
            required: [true, 'Severity is required.'],
        },
        status: {
            type: String,
            enum: ['open', 'acknowledged', 'resolved', 'dismissed'],
            default: 'open',
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
        expectedSpend: {
            type: Number,
            default: null,
        },
        actualSpend: {
            type: Number,
            default: null,
        },
        dateDetected: {
            type: Date,
            default: Date.now,
        },
        // Populated by Gemini 1.5 Flash (Task 8 — Sprint 1)
        aiExplanation: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Primary: org + status (dashboard open alert count)
alertSchema.index({ orgId: 1, status: 1 });

// Dashboard aggregation: org + createdAt desc (recent alerts list)
alertSchema.index({ orgId: 1, createdAt: -1 });

// Team-level view + status filter
alertSchema.index({ orgId: 1, teamId: 1, status: 1 });

// Anomaly detector dedup check (open alerts per service)
alertSchema.index({ orgId: 1, teamId: 1, resourceId: 1, status: 1 });

export default mongoose.model('Alert', alertSchema);
