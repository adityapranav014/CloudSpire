/**
 * costService.js
 *
 * Central cost data access layer.
 *
 * getCostData(orgId, provider?) is the single entry point for all cost queries.
 * It transparently falls back to sample data when an org has no connected accounts,
 * enabling a full demo experience for new users without any cloud credentials.
 *
 * Sample data isolation:
 *   - Sample records have { source: 'sample' } and fixed sentinel ObjectIds.
 *   - Real org records have { source: 'live' } and the org's real ObjectIds.
 *   - A real org NEVER sees sample data — the gate is CloudAccount.countDocuments.
 *
 * persistCostRecords() is used by cloud.js after fetching live billing data.
 */

import mongoose from 'mongoose';
import CostRecord from '../models/CostRecord.js';
import CloudAccount from '../models/CloudAccount.js';
import { logger } from '../utils/logger.js';
import { SAMPLE_ORG_ID, SAMPLE_TEAM_ID } from './sampleDataService.js';

// USD → INR multiplier applied to sample data responses.
// Real-org records are stored as-is (currency from the cloud provider).
// Sprint 2: replace with live forex API call, cache for 1hr.
const USD_TO_INR = 83;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns cost data for an org, transparently serving sample data when no
 * cloud accounts are connected.
 *
 * @param {mongoose.Types.ObjectId} orgId    - Real org ID (from JWT / middleware)
 * @param {string}                  provider - 'aws' | 'gcp' | 'azure' | null (all)
 * @param {object}                  opts
 * @param {Date}                    opts.from  - Start date (default: start of current month)
 * @param {Date}                    opts.to    - End date (default: now)
 * @returns {Promise<object>}
 *   {
 *     isSampleData: boolean,
 *     currency: 'USD' | 'INR',
 *     totalSpend: number,
 *     serviceBreakdown: [{ service, total }],
 *     regionBreakdown:  [{ region, total }],
 *     dailyTrend:       [{ date, total }],
 *     teamBreakdown:    [{ teamId, total }],
 *     records:          CostRecord[]    (raw, for drilldown)
 *   }
 */
export async function getCostData(orgId, provider = null, opts = {}) {
    const now            = new Date();
    const defaultFrom    = new Date(now.getFullYear(), now.getMonth(), 1);
    const { from = defaultFrom, to = now } = opts;

    // ── Gate: does this org have any connected cloud accounts? ─────────────────
    const accountCount = await CloudAccount.countDocuments({ orgId });
    const isSampleData = accountCount === 0;

    // Resolve the actual orgId to query against
    const queryOrgId = isSampleData ? SAMPLE_ORG_ID : orgId;

    // Build base match filter
    const matchFilter = {
        orgId:  queryOrgId,
        source: isSampleData ? 'sample' : 'live',
        date:   { $gte: from, $lte: to },
    };
    if (provider) matchFilter.provider = provider;

    // ── Run aggregations in parallel ──────────────────────────────────────────
    const [serviceBreakdown, regionBreakdown, dailyTrend, rawRecords] = await Promise.all([
        // Service breakdown: { _id: 'AmazonEC2', total: 1234.56 }
        CostRecord.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$service', total: { $sum: '$cost' } } },
            { $sort: { total: -1 } },
            { $limit: 20 },
        ]),

        // Region breakdown
        CostRecord.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$region', total: { $sum: '$cost' } } },
            { $sort: { total: -1 } },
        ]),

        // Daily trend — group by calendar day
        CostRecord.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$date' },
                    },
                    total: { $sum: '$cost' },
                },
            },
            { $sort: { _id: 1 } },
        ]),

        // Raw records for drilldown (capped at 1000 for API safety)
        CostRecord.find(matchFilter)
            .select('service region date cost currency resourceId provider')
            .sort({ date: -1 })
            .limit(1000)
            .lean(),
    ]);

    // Team breakdown — only meaningful for live data (sample has a single sentinel teamId)
    let teamBreakdown = [];
    if (!isSampleData) {
        teamBreakdown = await CostRecord.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$teamId', total: { $sum: '$cost' } } },
            { $sort: { total: -1 } },
        ]);
    }

    const totalSpend = serviceBreakdown.reduce((s, r) => s + r.total, 0);

    // Apply INR multiplier for sample data (stored in USD, but new orgs expect INR)
    const multiplier = isSampleData ? USD_TO_INR : 1;
    const currency   = isSampleData ? 'INR' : 'USD'; // real orgs: use their account currency

    return {
        isSampleData,
        currency,
        totalSpend: totalSpend * multiplier,
        serviceBreakdown: serviceBreakdown.map(r => ({
            service: r._id,
            total:   r.total * multiplier,
        })),
        regionBreakdown: regionBreakdown.map(r => ({
            region: r._id,
            total:  r.total * multiplier,
        })),
        dailyTrend: dailyTrend.map(r => ({
            date:  r._id,
            total: r.total * multiplier,
        })),
        teamBreakdown: teamBreakdown.map(r => ({
            teamId: r._id,
            total:  r.total * multiplier,
        })),
        records: isSampleData
            ? rawRecords.map(r => ({ ...r, cost: r.cost * multiplier }))
            : rawRecords,
    };
}

// ── persistCostRecords ────────────────────────────────────────────────────────

/**
 * Persist cost records from a cloud billing response into MongoDB.
 *
 * orgId is required — upsert filters include it so records from different
 * orgs sharing the same teamId (impossible post-Task1, but defensive) cannot
 * collide. The unique compound index on CostRecord enforces this at DB level.
 *
 * Silently skips on any error so the main API response is never blocked.
 */
export async function persistCostRecords(orgId, teamId, cloudAccountId, provider, resultsByTime = []) {
    try {
        const ops = [];

        for (const day of resultsByTime) {
            const date   = new Date(day.TimePeriod?.Start || day.date || Date.now());
            const groups = day.Groups || [];

            // When there are no groups, the total comes from Total.UnblendedCost
            if (groups.length === 0 && day.Total?.UnblendedCost) {
                ops.push({
                    updateOne: {
                        filter: { orgId, teamId, cloudAccountId, provider, date, service: 'Total', region: 'global' },
                        update: {
                            $set: {
                                cost: parseFloat(day.Total.UnblendedCost.Amount || 0),
                                currency: day.Total.UnblendedCost.Unit || 'USD',
                                source: 'live',
                            },
                        },
                        upsert: true,
                    },
                });
            }

            for (const group of groups) {
                const service = group.Keys?.[0] || 'Unknown';
                const amount  = parseFloat(group.Metrics?.UnblendedCost?.Amount || 0);
                ops.push({
                    updateOne: {
                        filter: { orgId, teamId, cloudAccountId, provider, date, service, region: 'global' },
                        update: {
                            $set: {
                                cost: amount,
                                currency: group.Metrics?.UnblendedCost?.Unit || 'USD',
                                source: 'live',
                            },
                        },
                        upsert: true,
                    },
                });
            }
        }

        if (ops.length > 0) {
            await CostRecord.bulkWrite(ops, { ordered: false });
            logger.info({ orgId, teamId, provider, count: ops.length }, 'Cost records persisted');
        }
    } catch (err) {
        logger.error({ err, orgId, teamId, provider }, 'Failed to persist cost records — continuing without save');
    }
}
