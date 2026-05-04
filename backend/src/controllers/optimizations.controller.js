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
    console.log('[OPTIMIZATIONS] GET /optimizations — User:', req.user, 'Query:', req.query, 'orgId:', req.orgId);

    const { orgId, teamId } = req; // injected by orgScope

    // Build filter — always include orgId, optionally narrow to teamId
    const filter = { orgId };
    if (req.query.teamId) {
        filter.teamId = req.query.teamId;
    }

    const optimizations = await Optimization.find(filter).lean();
    console.log('[OPTIMIZATIONS] getIndex — found optimizations:', optimizations.length);

    // If there are no optimizations in the DB, return a rich mock payload
    // so the frontend has a consistent experience during demos and local dev.
    if (optimizations.length === 0) {
        console.log('[OPTIMIZATIONS] getIndex — no optimizations in DB, serving mock data');
        logger.warn({ orgId }, 'No optimizations found in DB — serving mock optimizations data');
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

    const rightsizingRecommendations = optimizations
        .filter(o => o.type === 'rightsize')
        .map((item) => ({
            id: String(item._id),
            provider: item.provider,
            resourceType: item.type,
            resourceId: item.resourceId,
            resourceName: item.title.replace(/^Rightsize\s+/i, '') || item.title,
            currentType: item.description.match(/^(.+?) can be reduced to /i)?.[1] || 'Unknown',
            recommendedType: item.description.match(/can be reduced to (.+?) to save/i)?.[1] || 'Recommended',
            currentMonthlyCost: null,
            projectedMonthlyCost: null,
            monthlySavings: Number(item.potentialSavings || 0),
            annualSavings: Number(item.potentialSavings || 0) * 12,
            confidence: item.confidenceScore >= 0.85 ? 'high' : 'medium',
            region: item.teamId ? 'team-scoped' : 'global',
            account: 'Demo Org',
            status: item.status,
        }));

    const reservedInstanceOpportunities = optimizations
        .filter(o => o.type === 'reserved-instance')
        .map((item) => ({
            id: String(item._id),
            provider: item.provider,
            service: item.provider === 'aws' ? 'EC2' : 'Compute Engine',
            instanceType: item.resourceId,
            region: 'global',
            onDemandMonthlyCost: null,
            reservedMonthlyCost: null,
            monthlySavings: Number(item.potentialSavings || 0),
            term: '1 year',
            upfrontCost: 0,
            paymentOption: 'No Upfront',
            utilizationEstimate: Math.round((item.confidenceScore || 0.75) * 100),
            breakEvenMonths: 0,
            normalizedUsageHours: 720,
        }));

    const scheduledShutdowns = optimizations
        .filter(o => o.type === 'shutdown')
        .map((item) => ({
            id: String(item._id),
            name: item.title,
            description: item.description,
            enabled: item.status !== 'ignored',
            schedule: 'Daily 23:00 UTC',
            nextRun: null,
            estimatedSavings: Number(item.potentialSavings || 0),
        }));

    // Calculate savings breakdown by type
    const savingsBreakdown = {
        idleInstances: optimizations
            .filter(o => o.type === 'idle-instance')
            .reduce((acc, curr) => acc + Number(curr.potentialSavings || 0), 0),
        orphanedStorage: optimizations
            .filter(o => o.type === 'orphaned-resource')
            .reduce((acc, curr) => acc + Number(curr.potentialSavings || 0), 0),
        rightSizing: optimizations
            .filter(o => o.type === 'rightsize')
            .reduce((acc, curr) => acc + Number(curr.potentialSavings || 0), 0),
        reservedInstances: optimizations
            .filter(o => o.type === 'reserved-instance')
            .reduce((acc, curr) => acc + Number(curr.potentialSavings || 0), 0),
        scheduledShutdowns: optimizations
            .filter(o => o.type === 'shutdown')
            .reduce((acc, curr) => acc + Number(curr.potentialSavings || 0), 0),
    };

    const totalPotentialSavings = optimizations.reduce((acc, curr) => acc + Number(curr.potentialSavings || 0), 0);
    const implementedThisMonth = optimizations
        .filter(o => o.status === 'implemented')
        .reduce((acc, curr) => acc + Number(curr.potentialSavings || 0), 0);

    const optimizationSummary = {
        totalPotentialSavings,
        implementedThisMonth,
        savingsImplementedPercent: totalPotentialSavings > 0 ? Math.round((implementedThisMonth / totalPotentialSavings) * 100) : 0,
        savingsBreakdown,
        opportunitiesFound: optimizations.filter(o => o.status === 'pending').length,
    };

    console.log('[OPTIMIZATIONS] getIndex success — rightsize:', rightsizingRecommendations.length, 'reserved:', reservedInstanceOpportunities.length, 'shutdowns:', scheduledShutdowns.length, 'totalSavings:', optimizationSummary.totalPotentialSavings);

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
    console.log('[OPTIMIZATIONS] PUT /optimizations/:id — Params:', req.params, 'Body:', req.body, 'User:', req.user);

    const { id } = req.params;
    const { orgId, teamId } = req;
    const { enabled, targetStatus = 'pending' } = req.body;

    // Always scope the lookup to orgId — prevents cross-tenant execution
    const schedule = await Optimization.findOne({ _id: id, orgId });

    if (!schedule) {
        console.log('[OPTIMIZATIONS] updateSchedule error: Optimization not found — id:', id, 'orgId:', orgId);
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
                console.log('[OPTIMIZATIONS] updateSchedule — executed cloud optimization for:', schedule.resourceId);
            } catch (err) {
                console.error('[OPTIMIZATIONS] updateSchedule error — cloud execution failed:', err.message);
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
            console.log('[OPTIMIZATIONS] updateSchedule — mock mode, setting status to implemented');
            schedule.status = 'implemented';
        }
    } else {
        schedule.status = targetStatus;
    }

    await schedule.save();

    console.log('[OPTIMIZATIONS] updateSchedule success — id:', id, 'newStatus:', schedule.status);
    res.status(200).json({ success: true, data: { schedule } });
});
