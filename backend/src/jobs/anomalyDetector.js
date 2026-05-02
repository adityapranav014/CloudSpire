import CostRecord from '../models/CostRecord.js';
import Alert from '../models/Alert.js';
import Team from '../models/Team.js';
import Integration from '../models/Integration.js';
import { sendAnomalyAlertEmail } from '../services/emailService.js';
import { notifySlack } from '../services/integrationService.js';
import { emitToTeam } from '../services/socketService.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

// Minimal distributed lock: one record per job name in a dedicated collection.
// If another worker is already running, the findOneAndUpdate will not match (due to lockedAt check).
const JobLockSchema = new mongoose.Schema({
    _id: { type: String }, // job name
    lockedAt: { type: Date, required: true },
    lockedUntil: { type: Date, required: true },
});
const JobLock = mongoose.models.JobLock || mongoose.model('JobLock', JobLockSchema);

const JOB_NAME = 'anomaly-detector';
const LOCK_TTL_MS = 30 * 60 * 1000; // 30 minutes max runtime

async function acquireLock() {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + LOCK_TTL_MS);
    try {
        await JobLock.findOneAndUpdate(
            { _id: JOB_NAME, lockedUntil: { $lt: now } }, // only acquire if previous lock expired
            { lockedAt: now, lockedUntil },
            { upsert: true, new: true }
        );
        return true;
    } catch {
        return false; // another instance holds the lock (upsert failed on duplicate key)
    }
}

async function releaseLock() {
    await JobLock.findOneAndUpdate(
        { _id: JOB_NAME },
        { lockedUntil: new Date(0) } // expire immediately so next run can acquire
    );
}

export const analyzeAnomalies = async () => {
    const acquired = await acquireLock();
    if (!acquired) {
        logger.info('Anomaly detection job already running on another instance — skipping.');
        return;
    }

    try {
        logger.info('Running daily anomaly detection job');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const teams = await Team.find();

        for (const team of teams) {
            // Single aggregation: compute avg/max per service AND get latest record per service
            const [stats, latestRecords] = await Promise.all([
                CostRecord.aggregate([
                    { $match: { teamId: team._id, date: { $gte: thirtyDaysAgo } } },
                    { $group: { _id: '$service', avgCost: { $avg: '$cost' }, maxCost: { $max: '$cost' } } },
                ]),
                CostRecord.aggregate([
                    { $match: { teamId: team._id } },
                    { $sort: { date: -1 } },
                    { $group: { _id: '$service', latestCost: { $first: '$cost' }, provider: { $first: '$provider' } } },
                ]),
            ]);

            const latestMap = new Map(latestRecords.map((r) => [r._id, r]));

            const openAlerts = await Alert.find({ teamId: team._id, status: 'open' }).select('resourceId');
            const openAlertSet = new Set(openAlerts.map((a) => a.resourceId));

            const slackIntegration = await Integration.findOne({ teamId: team._id, provider: 'slack' });

            for (const stat of stats) {
                const latest = latestMap.get(stat._id);
                if (!latest || latest.latestCost <= stat.avgCost * 1.5) continue;
                if (openAlertSet.has(stat._id)) continue;

                const newAlert = await Alert.create({
                    teamId: team._id,
                    title: `${stat._id} Spend Surge`,
                    description: `Spend on ${stat._id} jumped to $${latest.latestCost} (avg: $${stat.avgCost.toFixed(2)})`,
                    severity: latest.latestCost > stat.avgCost * 3 ? 'critical' : 'high',
                    status: 'open',
                    provider: latest.provider,
                    resourceId: stat._id,
                    expectedSpend: stat.avgCost,
                    actualSpend: latest.latestCost,
                });

                // Emit real-time socket event
                emitToTeam(team._id, 'alert:new', newAlert);

                if (slackIntegration?.config?.webhookUrl) {
                    await notifySlack(slackIntegration.config.webhookUrl, `CloudSpire Anomaly: ${newAlert.title}`, {
                        Service: stat._id,
                        'Actual Spend': `$${latest.latestCost}`,
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