import Alert from '../models/Alert.model.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { budgetAlerts as mockBudgetAlerts, anomalyHistory as mockAnomalyHistory } from '../data/mockAlerts.js';
import { env } from '../config/env.js';

/**
 * GET /api/v1/alerts
 *
 * Returns all anomaly alerts for the authenticated org.
 * Optional query params:
 *   ?teamId=<id>   — filter to a specific team within the org
 *   ?status=open   — filter by status
 *   ?severity=high — filter by severity
 *   ?limit=50      — max results (default 100, max 200)
 */
export const getIndex = catchAsync(async (req, res) => {
    const { orgId } = req; // injected by orgScope — NEVER trust req.query.orgId

    // Build filter — orgId is always mandatory, other params are optional refinements
    const filter = { orgId };

    // Team filter: only allow filtering within the requester's own org
    if (req.query.teamId) {
        filter.teamId = req.query.teamId;
    }
    if (req.query.status) {
        filter.status = req.query.status;
    }
    if (req.query.severity) {
        filter.severity = req.query.severity;
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);

    const anomalies = await Alert.find(filter)
        .sort('-createdAt')
        .limit(limit)
        .lean();

    const anomalyStats = {
        resolvedThisMonth: anomalies.filter(a => a.status === 'resolved').length,
        spendPrevented: anomalies
            .filter(a => a.status === 'resolved')
            .reduce((acc, curr) => acc + ((curr.actualSpend ?? 0) - (curr.expectedSpend ?? 0)), 0),
    };

    // Mock budget + history data for dev (no real budget alert model yet)
    const budgetAlerts = env.nodeEnv !== 'production' ? mockBudgetAlerts : [];
    const anomalyHistory = env.nodeEnv !== 'production' ? mockAnomalyHistory : [];

    res.status(200).json({
        success: true,
        data: { anomalies, budgetAlerts, anomalyHistory, anomalyStats },
    });
});

/**
 * PUT /api/v1/alerts/:id
 *
 * Updates an alert's status. Verifies the alert belongs to the requester's org
 * before allowing the update — prevents cross-tenant status manipulation.
 */
export const updateAnomaly = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { orgId } = req;
    const { status } = req.body;

    if (!status) {
        return next(new AppError('Status field is required.', 400, 'MISSING_FIELDS'));
    }

    // Include orgId in the filter — prevents updating another org's alert by guessing the ID
    const anomaly = await Alert.findOneAndUpdate(
        { _id: id, orgId },
        { status },
        { new: true, runValidators: true }
    );

    if (!anomaly) {
        // Return 404 regardless of whether the alert doesn't exist or belongs to another org
        // (don't reveal the existence of resources from other orgs)
        return next(new AppError('Alert not found.', 404, 'NOT_FOUND'));
    }

    res.status(200).json({ success: true, data: { anomaly } });
});
