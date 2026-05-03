import mongoose from 'mongoose';

/**
 * CostRecord — one billing line item per service/day/provider/team.
 *
 * orgId is the primary tenant boundary. ALL queries MUST include orgId.
 * teamId is the secondary filter for team-level attribution.
 *
 * Compound index strategy:
 *   { orgId, teamId, date } — dashboard time-range aggregations
 *   { orgId, teamId, date, provider } — provider breakdown views
 *   { orgId, teamId, cloudAccountId } — account-level drilldown
 */
const costRecordSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Org',
            required: [true, 'CostRecord must belong to an organisation.'],
        },
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: [true, 'CostRecord must belong to a team.'],
        },
        cloudAccountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CloudAccount',
            default: null, // null for sample data records (source: 'sample')
        },
        provider: {
            type: String,
            enum: ['aws', 'gcp', 'azure'],
            required: [true, 'Provider is required.'],
        },
        date: {
            type: Date,
            required: [true, 'Date is required.'],
        },
        service: {
            type: String,
            required: [true, 'Service name is required.'],
        },
        region: {
            type: String,
            required: [true, 'Region is required.'],
        },
        cost: {
            type: Number,
            required: [true, 'Cost is required.'],
            min: [0, 'Cost cannot be negative.'],
        },
        currency: {
            type: String,
            default: 'USD',
        },
        // resourceId — AWS line_item_resource_id (ARN or resource name)
        resourceId: {
            type: String,
            default: null,
        },
        // source — isolates sample/demo data from real org billing records.
        // 'live'   → fetched from a real cloud account (AWS/GCP/Azure)
        // 'sample' → seeded from the AWS CUR sample CSV at startup
        //
        // RULE: NEVER query sample records for a real org. The dashboard
        // controller uses this field to serve sample data ONLY when the
        // org has zero connected CloudAccounts.
        source: {
            type: String,
            enum: ['live', 'sample'],
            default: 'live',
        },
    },
    { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Primary query pattern: org + team + date range (dashboard, cost explorer)
costRecordSchema.index({ orgId: 1, teamId: 1, date: -1 });

// Provider breakdown (cost explorer filter by provider)
costRecordSchema.index({ orgId: 1, teamId: 1, date: -1, provider: 1 });

// Anomaly detector aggregation (per service, 30-day window)
costRecordSchema.index({ orgId: 1, teamId: 1, date: -1, service: 1 });

// Fast isolation of sample records (used by sampleDataService seeder check)
costRecordSchema.index({ source: 1 });

// Upsert filter in costService.js (must be unique per day+service+region+account)
// cloudAccountId may be null for sample records — sparse avoids duplicate-null issues
costRecordSchema.index(
    { orgId: 1, teamId: 1, cloudAccountId: 1, provider: 1, date: 1, service: 1, region: 1 },
    { unique: true, sparse: true }
);

export default mongoose.model('CostRecord', costRecordSchema);
