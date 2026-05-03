/**
 * GET /api/v1/dashboard/summary
 *
 * All cost data now flows through getCostData() which transparently returns:
 *   - Real billing data if the org has connected CloudAccounts
 *   - AWS CUR sample data (from the official aws-samples repo) if not
 *
 * The response shape is always the same — the frontend doesn't need to know
 * whether it's seeing demo or real data. The isSampleData flag is passed
 * to the frontend so it can show the DemoBanner component.
 *
 * Org scoping:
 *   orgId is injected by orgScope middleware on every protected request.
 *   getCostData() internally handles the sample → real data gate.
 */

import Alert from '../models/Alert.js';
import Optimization from '../models/Optimization.js';
import CloudAccount from '../models/CloudAccount.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { logger } from '../utils/logger.js';
import { getCostData } from '../services/costService.js';
import { generateDashboardNarrative } from '../services/openRouterService.js';

export const getDashboardSummary = catchAsync(async (req, res) => {
    const { orgId } = req; // set by orgScope middleware

    const now              = new Date();
    const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfToday     = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ── Fetch cost data (sample or real, transparently) ───────────────────────
    const [
        thisMonthData,
        lastMonthData,
        todayData,
        openAlerts,
        openRecommendations,
        cloudAccounts,
    ] = await Promise.all([
        getCostData(orgId, null, { from: startOfMonth, to: now }),
        getCostData(orgId, null, { from: startOfLastMonth, to: endOfLastMonth }),
        getCostData(orgId, null, { from: startOfToday,  to: now }),

        // Alerts and recommendations always query the real org (not sample sentinel)
        Alert.find({ orgId, status: 'open' }).sort('-createdAt').limit(10).lean(),
        Optimization.find({ orgId, status: 'pending' }).lean(),
        CloudAccount.find({ orgId }).select('provider name status lastSync').lean(),
    ]);

    const totalMonthSpend = thisMonthData.totalSpend;
    const lastMonthSpend  = lastMonthData.totalSpend;
    const todaySpend      = todayData.totalSpend;
    const isSampleData    = thisMonthData.isSampleData;
    const currency        = thisMonthData.currency;

    const pctChange = lastMonthSpend > 0
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

    // Generate AI narrative (non-blocking — fails gracefully)
    const topService = thisMonthData.serviceBreakdown?.[0]?.service || 'compute';
    const aiNarrative = await generateDashboardNarrative({
        totalMonthSpend,
        changePercent: pctChange ? parseFloat(pctChange) : 0,
        topService,
        savingsAvailable: potentialSavings,
        openAlerts: openAlerts.length,
    }).catch(() => null);

    res.status(200).json({
        success: true,
        data: {
            // ── KPI cards ─────────────────────────────────────────────────────
            totalMonthSpend,
            lastMonthSpend,
            pctChangeVsLastMonth:    pctChange,
            todaySpend,

            // ── Breakdown data (for charts) ───────────────────────────────────
            serviceBreakdown:        thisMonthData.serviceBreakdown,
            regionBreakdown:         thisMonthData.regionBreakdown,
            dailyTrend:              thisMonthData.dailyTrend,
            teamBreakdown:           thisMonthData.teamBreakdown,

            // ── Alerts & recommendations ──────────────────────────────────────
            activeAlerts:            alertCounts,
            recentAlerts:            openAlerts.slice(0, 5),
            potentialSavings,
            openRecommendationsCount: openRecommendations.length,

            // ── Accounts ──────────────────────────────────────────────────────
            connectedAccounts:       cloudAccounts,

            // ── Demo mode flag ────────────────────────────────────────────────
            // Frontend uses this to show/hide the DemoBanner component.
            // NEVER use this flag to make security decisions — it's UI-only.
            isSampleData,
            currency,

            // ── AI narrative ──────────────────────────────────────────────────
            // Plain-English executive summary generated by OpenRouter.
            // null when OPENROUTER_API_KEY is not set or the call fails.
            aiNarrative: aiNarrative || null,

            generatedAt: now.toISOString(),
        },
    });
});
