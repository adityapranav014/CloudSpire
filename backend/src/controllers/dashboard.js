import CostRecord from '../models/CostRecord.js';
import Alert from '../models/Alert.js';
import Optimization from '../models/Optimization.js';
import CloudAccount from '../models/CloudAccount.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/v1/dashboard/summary
 *
 * All queries are scoped by orgId (injected by orgScope middleware).
 * Admin users see the full org view (all teams).
 * Team leads / engineers see the same org data — team-level filtering
 * can be added as a query param in Sprint 2 (RBAC audit).
 *
 * Aggregate pipelines must use mongoose.Types.ObjectId cast on orgId
 * because $match in aggregation compares the raw BSON value, not the
 * Mongoose string representation.
 */
export const getDashboardSummary = catchAsync(async (req, res) => {
    const { orgId } = req; // set by orgScope middleware

    const now = new Date();
    const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfToday     = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Run all DB queries in parallel — orgId scoped, no cross-tenant leakage
    const [
        thisMonthCosts,
        lastMonthCosts,
        todayCosts,
        openAlerts,
        openRecommendations,
        cloudAccounts,
    ] = await Promise.all([
        CostRecord.aggregate([
            { $match: { orgId, date: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$cost' } } },
        ]),
        CostRecord.aggregate([
            { $match: { orgId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
            { $group: { _id: null, total: { $sum: '$cost' } } },
        ]),
        CostRecord.aggregate([
            { $match: { orgId, date: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: '$cost' } } },
        ]),
        Alert.find({ orgId, status: 'open' }).sort('-createdAt').limit(10).lean(),
        Optimization.find({ orgId, status: 'pending' }).lean(),
        CloudAccount.find({ orgId }).select('provider name status lastSync').lean(),
    ]);

    const totalMonthSpend = thisMonthCosts[0]?.total ?? 0;
    const lastMonthSpend  = lastMonthCosts[0]?.total ?? 0;
    const todaySpend      = todayCosts[0]?.total ?? 0;
    const pctChange       = lastMonthSpend > 0
        ? (((totalMonthSpend - lastMonthSpend) / lastMonthSpend) * 100).toFixed(1)
        : null;

    const potentialSavings = openRecommendations.reduce(
        (sum, r) => sum + (r.potentialSavings || 0),
        0
    );

    const alertCounts = {
        critical: openAlerts.filter(a => a.severity === 'critical').length,
        high:     openAlerts.filter(a => a.severity === 'high').length,
        medium:   openAlerts.filter(a => a.severity === 'medium').length,
        low:      openAlerts.filter(a => a.severity === 'low').length,
        total:    openAlerts.length,
    };

    res.status(200).json({
        success: true,
        data: {
            totalMonthSpend,
            lastMonthSpend,
            pctChangeVsLastMonth: pctChange,
            todaySpend,
            activeAlerts: alertCounts,
            recentAlerts: openAlerts.slice(0, 5),
            potentialSavings,
            openRecommendationsCount: openRecommendations.length,
            connectedAccounts: cloudAccounts,
            generatedAt: now.toISOString(),
        },
    });
});
