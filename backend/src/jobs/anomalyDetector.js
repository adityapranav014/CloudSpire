import cron from 'node-cron';
import CostRecord from '../models/CostRecord.model.js';
import Alert from '../models/Alert.model.js';
import Team from '../models/Team.model.js';
import Integration from '../models/Integration.model.js';
import { sendAnomalyAlertEmail } from '../services/emailService.js';
import { notifySlack } from '../services/integrationService.js';
import { emitToOrg } from '../services/socketService.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

// ── Distributed lock ──────────────────────────────────────────────────────────
// Prevents concurrent execution across multiple Node instances (e.g. Railway).
const JobLockSchema = new mongoose.Schema({
    _id: { type: String },         // job name
    lockedAt: { type: Date, required: true },
    lockedUntil: { type: Date, required: true },
});
const JobLock = mongoose.models.JobLock || mongoose.model('JobLock', JobLockSchema);

const JOB_NAME    = 'anomaly-detector';
const LOCK_TTL_MS = 30 * 60 * 1000; // 30 minutes max runtime

async function acquireLock() {
    const now         = new Date();
    const lockedUntil = new Date(now.getTime() + LOCK_TTL_MS);
    try {
        await JobLock.findOneAndUpdate(
            { _id: JOB_NAME, lockedUntil: { $lt: now } },
            { lockedAt: now, lockedUntil },
            { upsert: true, new: true }
        );
        return true;
    } catch {
        return false;
    }
}

async function releaseLock() {
    await JobLock.findOneAndUpdate(
        { _id: JOB_NAME },
        { lockedUntil: new Date(0) }
    );
}

// ── Main job ──────────────────────────────────────────────────────────────────

export const analyzeAnomalies = async () => {
    const acquired = await acquireLock();
    if (!acquired) {
        logger.info('Anomaly detection job already running on another instance — skipping.');
        return;
    }

    try {
        logger.info('Running anomaly detection job');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Fetch all teams with their orgId — MUST be populated for multi-tenant isolation
        // Teams created before Task 1 will have no orgId: they are skipped (safe degradation).
        const teams = await Team.find({ orgId: { $exists: true, $ne: null } });

        for (const team of teams) {
            const orgId  = team.orgId;
            const teamId = team._id;

            // Single aggregation: per-service avg/max over the 30-day window
            const [stats, latestRecords] = await Promise.all([
                CostRecord.aggregate([
                    { $match: { orgId, teamId, date: { $gte: thirtyDaysAgo } } },
                    { $group: { _id: '$service', avgCost: { $avg: '$cost' }, maxCost: { $max: '$cost' } } },
                ]),
                CostRecord.aggregate([
                    { $match: { orgId, teamId } },
                    { $sort: { date: -1 } },
                    { $group: { _id: '$service', latestCost: { $first: '$cost' }, provider: { $first: '$provider' } } },
                ]),
            ]);

            const latestMap = new Map(latestRecords.map(r => [r._id, r]));

            // Dedup check: skip if an open alert for this service already exists for this org+team
            const openAlerts  = await Alert.find({ orgId, teamId, status: 'open' }).select('resourceId').lean();
            const openAlertSet = new Set(openAlerts.map(a => a.resourceId));

            const slackIntegration = await Integration.findOne({ teamId, provider: 'slack' });

            for (const stat of stats) {
                const latest = latestMap.get(stat._id);
                if (!latest || latest.latestCost <= stat.avgCost * 1.5) continue;
                if (openAlertSet.has(stat._id)) continue;

                // Create alert with orgId — required field as of Task 3
                const newAlert = await Alert.create({
                    orgId,
                    teamId,
                    title: `${stat._id} Spend Surge`,
                    description: `Spend on ${stat._id} jumped to $${latest.latestCost.toFixed(2)} (30-day avg: $${stat.avgCost.toFixed(2)})`,
                    severity: latest.latestCost > stat.avgCost * 3 ? 'critical' : 'high',
                    status: 'open',
                    provider: latest.provider,
                    resourceId: stat._id,
                    expectedSpend: stat.avgCost,
                    actualSpend: latest.latestCost,
                    // aiExplanation will be added in Task 8 (Gemini integration)
                });

                logger.info({ orgId, teamId, alertId: newAlert._id, service: stat._id }, 'Anomaly alert created');

                // Emit to org-scoped socket room (Task 4 fixes: teamId → org:${orgId})
                emitToOrg(orgId, 'alert:new', newAlert);

                if (slackIntegration?.config?.webhookUrl) {
                    await notifySlack(slackIntegration.config.webhookUrl, `CloudPulse Anomaly: ${newAlert.title}`, {
                        Service: stat._id,
                        'Actual Spend':   `$${latest.latestCost.toFixed(2)}`,
                        'Expected Spend': `$${stat.avgCost.toFixed(2)}`,
                    });
                }
            }
        }

        logger.info('Anomaly detection job completed');
    } catch (err) {
        logger.error({ err }, 'Anomaly detection job failed');
    } finally {
        await releaseLock();
    }
};