import CostRecord from '../models/CostRecord.js';
import Alert from '../models/Alert.js';
import Optimization from '../models/Optimization.js';
import CloudAccount from '../models/CloudAccount.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { logger } from '../utils/logger.js';

export const getDashboardSummary = catchAsync(async (req, res) => {
    const teamId = req.user.teamId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Run all DB queries in parallel for performance
    const [
        thisMonthCosts,
        lastMonthCosts,
        todayCosts,
        openAlerts,
        openRecommendations,
        cloudAccounts,
    ] = await Promise.all([
        CostRecord.aggregate([
            { $match: { teamId, date: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$cost' } } },
        ]),
        CostRecord.aggregate([
            { $match: { teamId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
            { $group: { _id: null, total: { $sum: '$cost' } } },
        ]),
        CostRecord.aggregate([
            { $match: { teamId, date: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: '$cost' } } },
        ]),
        Alert.find({ teamId, status: 'open' }).sort('-createdAt').limit(10).lean(),
        Optimization.find({ teamId, status: 'pending' }).lean(),
        CloudAccount.find({ teamId }).select('provider name status lastSync').lean(),
    ]);

    const totalMonthSpend = thisMonthCosts[0]?.total ?? 0;
    const lastMonthSpend = lastMonthCosts[0]?.total ?? 0;
    const todaySpend = todayCosts[0]?.total ?? 0;
    const pctChange = lastMonthSpend > 0
        ? (((totalMonthSpend - lastMonthSpend) / lastMonthSpend) * 100).toFixed(1)
        : null;

    const potentialSavings = openRecommendations.reduce(
        (sum, r) => sum + (r.potentialSavings || 0),
        0
    );

    const alertCounts = {
        critical: openAlerts.filter(a => a.severity === 'critical').length,
        high: openAlerts.filter(a => a.severity === 'high').length,
        medium: openAlerts.filter(a => a.severity === 'medium').length,
        low: openAlerts.filter(a => a.severity === 'low').length,
        total: openAlerts.length,
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
