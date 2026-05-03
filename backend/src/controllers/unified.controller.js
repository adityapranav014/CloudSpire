import { catchAsync } from '../middleware/asyncHandler.js';
import { getCostData } from '../services/costService.js';
import { UNIFIED_SCHEMA_FIELDS, tagBreakdown } from '../data/mockUnified.js';

/**
 * GET /api/v1/unified
 *
 * Returns unified cost data across all providers for the authenticated org.
 * Transparently serves sample data when no cloud accounts are connected.
 * Shape is always the same so the frontend never needs to know if it's demo or real.
 */
export const getIndex = catchAsync(async (req, res, next) => {
    console.log('[UNIFIED] GET /unified — User:', req.user, 'orgId:', req.orgId);

    const { orgId } = req;

    // Last 90 days for trend data
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const costData = await getCostData(orgId, null, { from: ninetyDaysAgo, to: now });

    // Build monthlySpend array grouped by month from dailyTrend
    const monthlyMap = {};
    for (const day of costData.dailyTrend) {
        const month = day.date.slice(0, 7); // "YYYY-MM"
        if (!monthlyMap[month]) monthlyMap[month] = { month, aws: 0, gcp: 0, azure: 0, total: 0 };
        monthlyMap[month].total += day.total;
        monthlyMap[month].aws += day.total * 0.55;   // approximate split until per-provider data available
        monthlyMap[month].gcp += day.total * 0.25;
        monthlyMap[month].azure += day.total * 0.20;
    }
    const monthlySpend = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // currentMonthStats
    const currentMonth = now.toISOString().slice(0, 7);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);
    const currStats = monthlyMap[currentMonth] || { total: costData.totalSpend };
    const prevStats = monthlyMap[prevMonth] || { total: 0 };

    const changePercent = prevStats.total > 0
        ? +((((currStats.total || costData.totalSpend) - prevStats.total) / prevStats.total) * 100).toFixed(1)
        : 0;

    const currentMonthStats = {
        totalSpend: costData.totalSpend,
        prevMonthSpend: prevStats.total,
        changePercent,
        projectedMonthEnd: costData.totalSpend * 1.12,
        budgetUsedPercent: Math.min(Math.round((costData.totalSpend / (costData.totalSpend * 1.2 || 1)) * 100), 100),
        savingsIdentified: 0,
    };

    const dailySpend = costData.dailyTrend.map(d => ({
        date: d.date,
        // When per-provider daily breakdown is available it will be injected here.
        // Until then, approximate using the same split ratios used in monthlySpend.
        aws:   +(d.total * 0.55).toFixed(2),
        gcp:   +(d.total * 0.25).toFixed(2),
        azure: +(d.total * 0.20).toFixed(2),
        total: +d.total.toFixed(2),
    }));

    console.log('[UNIFIED] getIndex success — dailySpend entries:', dailySpend.length, 'isSampleData:', costData.isSampleData);

    res.status(200).json({
        UNIFIED_SCHEMA_FIELDS,
        dailySpend,
        monthlySpend,
        currentMonthStats,
        tagBreakdown,
        isSampleData: costData.isSampleData,
        currency: costData.currency,
    });
});
