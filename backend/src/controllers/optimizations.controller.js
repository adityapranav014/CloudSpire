import Optimization from '../models/Optimization.model.js';
import CloudAccount from '../models/CloudAccount.js';
import { executeAwsOptimization } from '../services/awsService.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logAction } from '../services/auditService.js';
import {
    optimizationSummary as mockSummary,
    rightsizingRecommendations as mockRightsize,
    reservedInstanceOpportunities as mockReserved,
    scheduledShutdowns as mockShutdowns,
} from '../data/mockOptimizations.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/v1/optimizations
 *
 * Returns all optimization recommendations for the authenticated org.
 * Optional query param: ?teamId=<id> to filter within the org.
 */
export const getIndex = catchAsync(async (req, res) => {
    const { orgId, teamId } = req; // injected by orgScope

    // Build filter — always include orgId, optionally narrow to teamId
    const filter = { orgId };
    if (req.query.teamId) {
        filter.teamId = req.query.teamId;
    }

    const optimizations = await Optimization.find(filter).lean();

    // Fall back to rich mock data in dev when no real optimizations exist
    if (env.nodeEnv !== 'production' && optimizations.length === 0) {
        logger.warn({ orgId }, 'Serving mock optimizations data — not for production use');
        return res.status(200).json({
            success: true,
            data: {
                optimizationSummary: mockSummary,
                rightsizingRecommendations: mockRightsize,
                reservedInstanceOpportunities: mockReserved,
                scheduledShutdowns: mockShutdowns,
            },
        });
    }

    const rightsizingRecommendations       = optimizations.filter(o => o.type === 'rightsize');
    const reservedInstanceOpportunities    = optimizations.filter(o => o.type === 'reserved-instance');
    const scheduledShutdowns               = optimizations.filter(o => o.type === 'shutdown');

    const optimizationSummary = {
        totalSavings: optimizations.reduce((acc, curr) => acc + curr.potentialSavings, 0),
        implementedThisMonth: optimizations.filter(o => o.status === 'implemented').length,
        opportunitiesFound: optimizations.filter(o => o.status === 'pending').length,
    };

    res.status(200).json({
        success: true,
        data: {
            optimizationSummary,
            rightsizingRecommendations,
            reservedInstanceOpportunities,
            scheduledShutdowns,
        },
    });
});

/**
 * PUT /api/v1/optimizations/:id
 *
 * Executes or updates the status of an optimization recommendation.
 * Verifies the optimization belongs to the requester's org before any action.
 */
export const updateSchedule = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { orgId, teamId } = req;
    const { enabled, targetStatus = 'pending' } = req.body;

    // Always scope the lookup to orgId — prevents cross-tenant execution
    const schedule = await Optimization.findOne({ _id: id, orgId });

    if (!schedule) {
        return next(new AppError('Optimization task not found.', 404, 'NOT_FOUND'));
    }

    if (enabled === true || targetStatus === 'implemented') {
        // Cloud account must belong to the same org
        const cloudAcc = await CloudAccount.findOne({
            orgId,
            teamId: schedule.teamId,
            provider: schedule.provider,
        });

        if (cloudAcc?.credentials?.accessKey) {
            try {
                await executeAwsOptimization(cloudAcc.credentials, schedule.type, schedule.resourceId);
                schedule.status = 'implemented';

                await logAction({
                    orgId,
                    teamId,
                    userId: req.user?.id,
                    action: 'optimization_executed',
                    category: 'optimization',
                    details: {
                        resourceId: schedule.resourceId,
                        type: schedule.type,
                        provider: schedule.provider,
                    },
                });
            } catch (err) {
                logger.error({ err, orgId, resourceId: schedule.resourceId }, 'Cloud optimization execution failed');
                return next(
                    new AppError(
                        'Failed to execute cloud optimization. The provider may be temporarily unavailable.',
                        502,
                        'CLOUD_ACTION_FAILED'
                    )
                );
            }
        } else {
            // Mock mode success if no real credentials
            schedule.status = 'implemented';
        }
    } else {
        schedule.status = targetStatus;
    }

    await schedule.save();

    res.status(200).json({ success: true, data: { schedule } });
});
