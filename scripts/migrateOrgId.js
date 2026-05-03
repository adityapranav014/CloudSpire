/**
 * scripts/migrateOrgId.js
 *
 * One-time migration: backfills orgId on CostRecord, Alert, Optimization,
 * and CloudAccount documents created before Task 3 (orgId was added to all models).
 *
 * Strategy:
 *   1. For each document missing orgId, look up its Team to get team.orgId
 *   2. If the team has an orgId, apply it to the document
 *   3. Documents whose team has no orgId are logged as warnings — manual cleanup needed
 *
 * SAFETY:
 *   - Read-only until you confirm the counts look correct
 *   - Run with DRY_RUN=true first
 *   - Only updates documents where orgId is null/undefined — idempotent
 *   - Does NOT delete any data
 *
 * Usage:
 *   DRY_RUN=true node scripts/migrateOrgId.js
 *   node scripts/migrateOrgId.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const DRY_RUN = process.env.DRY_RUN === 'true';

// ── Inline model definitions (avoids app bootstrap) ──────────────────────────
const teamSchema = new mongoose.Schema({ orgId: mongoose.Schema.Types.ObjectId }, { strict: false });
const Team = mongoose.model('Team', teamSchema);

const costRecordSchema = new mongoose.Schema({ teamId: mongoose.Schema.Types.ObjectId, orgId: mongoose.Schema.Types.ObjectId }, { strict: false });
const CostRecord = mongoose.model('CostRecord', costRecordSchema);

const alertSchema = new mongoose.Schema({ teamId: mongoose.Schema.Types.ObjectId, orgId: mongoose.Schema.Types.ObjectId }, { strict: false });
const Alert = mongoose.model('Alert', alertSchema);

const optimizationSchema = new mongoose.Schema({ teamId: mongoose.Schema.Types.ObjectId, orgId: mongoose.Schema.Types.ObjectId }, { strict: false });
const Optimization = mongoose.model('Optimization', optimizationSchema);

const cloudAccountSchema = new mongoose.Schema({ teamId: mongoose.Schema.Types.ObjectId, orgId: mongoose.Schema.Types.ObjectId }, { strict: false });
const CloudAccount = mongoose.model('CloudAccount', cloudAccountSchema);

// ── Migration helpers ──────────────────────────────────────────────────────────

async function migrateCollection(Model, label) {
    // Find all documents missing orgId
    const docs = await Model.find({ orgId: { $exists: false } }).select('_id teamId').lean();

    if (docs.length === 0) {
        console.log(`[${label}] ✅ No documents to migrate`);
        return { migrated: 0, skipped: 0 };
    }

    console.log(`[${label}] Found ${docs.length} document(s) missing orgId`);

    // Batch team lookups to avoid N+1
    const teamIds = [...new Set(docs.map(d => d.teamId?.toString()).filter(Boolean))];
    const teams   = await Team.find({ _id: { $in: teamIds } }).select('_id orgId').lean();
    const teamMap = new Map(teams.map(t => [t._id.toString(), t.orgId]));

    let migrated = 0;
    let skipped  = 0;

    for (const doc of docs) {
        const orgId = teamMap.get(doc.teamId?.toString());

        if (!orgId) {
            console.warn(`  ⚠️  [${label}] ${doc._id}: team ${doc.teamId} has no orgId — skipping`);
            skipped++;
            continue;
        }

        if (DRY_RUN) {
            console.log(`  [DRY RUN] Would update ${label} ${doc._id} → orgId: ${orgId}`);
            migrated++;
            continue;
        }

        await Model.updateOne({ _id: doc._id }, { $set: { orgId } });
        migrated++;
    }

    console.log(`[${label}] Migrated: ${migrated}, Skipped: ${skipped}`);
    return { migrated, skipped };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('ERROR: MONGODB_URI environment variable is not set.');
        process.exit(1);
    }

    console.log(`\n🔧 CloudPulse orgId Migration — ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
    console.log(`   MongoDB: ${uri.replace(/:([^@]+)@/, ':****@')}\n`);

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    const results = await Promise.all([
        migrateCollection(CostRecord, 'CostRecord'),
        migrateCollection(Alert, 'Alert'),
        migrateCollection(Optimization, 'Optimization'),
        migrateCollection(CloudAccount, 'CloudAccount'),
    ]);

    const totalMigrated = results.reduce((s, r) => s + r.migrated, 0);
    const totalSkipped  = results.reduce((s, r) => s + r.skipped, 0);

    console.log(`\n📊 Summary: ${totalMigrated} migrated, ${totalSkipped} skipped`);

    if (DRY_RUN) {
        console.log('\n⚠️  DRY RUN — no changes written. Remove DRY_RUN=true to apply.\n');
    } else {
        console.log('\n✅ Migration complete.\n');
    }

    await mongoose.disconnect();
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
