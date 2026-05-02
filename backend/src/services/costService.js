import CostRecord from '../models/CostRecord.js';
import { logger } from '../utils/logger.js';

/**
 * Persist cost records from a cloud billing response into MongoDB.
 * Silently skips on any error so the main response is never blocked.
 */
export async function persistCostRecords(teamId, cloudAccountId, provider, resultsByTime = []) {
    try {
        const ops = [];
        for (const day of resultsByTime) {
            const date = new Date(day.TimePeriod?.Start || day.date || Date.now());
            const groups = day.Groups || [];

            // When there are no groups, the total comes from Total.UnblendedCost
            if (groups.length === 0 && day.Total?.UnblendedCost) {
                ops.push({
                    updateOne: {
                        filter: { teamId, cloudAccountId, provider, date, service: 'Total', region: 'global' },
                        update: {
                            $set: {
                                cost: parseFloat(day.Total.UnblendedCost.Amount || 0),
                                currency: day.Total.UnblendedCost.Unit || 'USD',
                            },
                        },
                        upsert: true,
                    },
                });
            }

            for (const group of groups) {
                const service = group.Keys?.[0] || 'Unknown';
                const amount = parseFloat(group.Metrics?.UnblendedCost?.Amount || 0);
                ops.push({
                    updateOne: {
                        filter: { teamId, cloudAccountId, provider, date, service, region: 'global' },
                        update: {
                            $set: {
                                cost: amount,
                                currency: group.Metrics?.UnblendedCost?.Unit || 'USD',
                            },
                        },
                        upsert: true,
                    },
                });
            }
        }

        if (ops.length > 0) {
            await CostRecord.bulkWrite(ops, { ordered: false });
            logger.info({ teamId, provider, count: ops.length }, 'Cost records persisted');
        }
    } catch (err) {
        logger.error({ err, teamId, provider }, 'Failed to persist cost records — continuing without save');
    }
}
