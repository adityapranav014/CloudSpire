import Optimization from '../models/Optimization.js';
import CloudAccount from '../models/CloudAccount.js';
import { executeAwsOptimization } from '../services/awsService.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logAction } from '../services/auditService.js';
import { optimizationSummary as mockSummary, rightsizingRecommendations as mockRightsize, reservedInstanceOpportunities as mockReserved, scheduledShutdowns as mockShutdowns } from '../data/mockOptimizations.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const getIndex = catchAsync(async (req, res, next) => {
    const teamId = req.user.teamId;
    const filter = req.query.teamId ? { teamId: req.query.teamId } : { teamId };
    const optimizations = await Optimization.find(filter);

    // Fall back to rich mock data in dev when no real optimizations exist
    if (env.nodeEnv !== 'production' && optimizations.length === 0) {
        logger.warn('Serving mock optimizations data — not for production use');
        return res.status(200).json({
            success: true,
            data: {
                optimizationSummary: mockSummary,
                rightsizingRecommendations: mockRightsize,
                reservedInstanceOpportunities: mockReserved,
                scheduledShutdowns: mockShutdowns,
            }
        });
    }

    const rightsizingRecommendations = optimizations.filter(o => o.type === 'rightsize');
    const reservedInstanceOpportunities = optimizations.filter(o => o.type === 'reserved-instance');
    const scheduledShutdowns = optimizations.filter(o => o.type === 'shutdown');

    const optimizationSummary = {
        totalSavings: optimizations.reduce((acc, curr) => acc + curr.potentialSavings, 0),
        implementedThisMonth: optimizations.filter(o => o.status === 'implemented').length,
        opportunitiesFound: optimizations.filter(o => o.status === 'pending').length
    };

    res.status(200).json({
        success: true,
        data: {
            optimizationSummary,
            rightsizingRecommendations,
            reservedInstanceOpportunities,
            scheduledShutdowns
        }
    });
});

export const updateSchedule = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { enabled, targetStatus = 'pending' } = req.body;
    const teamId = req.user.teamId;

    // In Phase 5: Executing real optimizations
    let schedule = await Optimization.findById(id);

    if (!schedule) {
        return next(new AppError('Optimization task not found.', 404, 'NOT_FOUND'));
    }

    if (enabled === true || targetStatus === 'implemented') {
        const cloudAcc = await CloudAccount.findOne({ teamId, provider: schedule.provider });
        if (cloudAcc && cloudAcc.credentials?.accessKey) {
            try {
                // Actually execute against AWS!
                await executeAwsOptimization(cloudAcc.credentials, schedule.type, schedule.resourceId);
                schedule.status = 'implemented';

                // Keep the audit trail for compliance!
                await logAction({
                    teamId,
                    userId: req.user?.id,
                    action: 'optimization_executed',
                    category: 'optimization',
                    details: { resourceId: schedule.resourceId, type: schedule.type, provider: schedule.provider }
                });
            } catch (err) {
                console.error("Action execution failed:", err.message);
                return next(new AppError('Failed to execute cloud optimization. The provider may be temporarily unavailable.', 502, 'CLOUD_ACTION_FAILED'));
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
