import CloudAccount from '../models/CloudAccount.js';
import { persistCostRecords } from '../services/costService.js';
import { fetchAwsCostAndUsage, fetchAwsInstances } from '../services/awsService.js';
import { fetchAzureCostAndUsage, fetchAzureVMs } from '../services/azureService.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logAction } from '../services/auditService.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

import { awsAccounts, awsServiceBreakdown, awsEC2Instances, awsOrphanedResources, awsRegionBreakdown } from '../data/mockAWS.js';
import { azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown, azureOrphanedResources } from '../data/mockAzure.js';
import { gcpProjects, gcpServiceBreakdown, gcpRegionBreakdown, gcpCommittedUseDiscounts, gcpOrphanedResources } from '../data/mockGCP.js';

export const getAws = catchAsync(async (req, res, next) => {
    const { orgId, teamId } = req;
    const accounts = await CloudAccount.find({ orgId, provider: 'aws' });

    if (accounts?.length > 0 && accounts[0].credentials?.accessKey) {
        try {
            const start = new Date(new Date().setDate(1)).toISOString().split('T')[0];
            const end   = new Date().toISOString().split('T')[0];

            const [liveCostData, liveInstances] = await Promise.all([
                fetchAwsCostAndUsage(accounts[0].credentials, start, end),
                fetchAwsInstances(accounts[0].credentials),
            ]);

            // Persist to DB — non-blocking, passes orgId for proper scoping
            persistCostRecords(orgId, teamId, accounts[0]._id, 'aws', liveCostData.ResultsByTime);

            return res.status(200).json({
                success: true,
                data: {
                    awsAccounts: accounts,
                    awsServiceBreakdown: liveCostData.ResultsByTime,
                    awsEC2Instances: liveInstances,
                    awsOrphanedResources: [],
                    awsRegionBreakdown: [],
                },
            });
        } catch (error) {
            logger.warn({ err: error, orgId }, 'Failed real AWS sync, falling back to mock data');
        }
    }

    if (env.nodeEnv === 'production') {
        return next(new AppError('No AWS accounts configured for this organisation.', 404, 'NO_CLOUD_ACCOUNTS'));
    }

    logger.warn({ orgId }, 'Serving mock AWS data — not for production use');
    res.status(200).json({ awsAccounts, awsServiceBreakdown, awsEC2Instances, awsOrphanedResources, awsRegionBreakdown });
});

export const getAzure = catchAsync(async (req, res, next) => {
    const { orgId, teamId } = req;
    const accounts = await CloudAccount.find({ orgId, provider: 'azure' });

    if (accounts?.length > 0 && accounts[0].credentials?.tenantId) {
        try {
            const start = new Date(new Date().setDate(1)).toISOString().split('T')[0];
            const end   = new Date().toISOString().split('T')[0];

            const [liveCostData, liveVMs] = await Promise.all([
                fetchAzureCostAndUsage(accounts[0].credentials, start, end),
                fetchAzureVMs(accounts[0].credentials),
            ]);

            const normalised = (liveCostData || []).map(row => ({
                TimePeriod: { Start: row[1] || new Date().toISOString().split('T')[0] },
                Groups: [{ Keys: [row[2] || 'Unknown'], Metrics: { UnblendedCost: { Amount: row[0] || 0, Unit: 'USD' } } }],
            }));
            persistCostRecords(orgId, teamId, accounts[0]._id, 'azure', normalised);

            return res.status(200).json({
                success: true,
                data: {
                    azureSubscriptions: accounts,
                    azureServiceBreakdown: liveCostData,
                    azureVMs: liveVMs,
                    azureRegionBreakdown: [],
                    azureOrphanedResources: [],
                },
            });
        } catch (error) {
            logger.warn({ err: error, orgId }, 'Failed real Azure sync, falling back to mock data');
        }
    }

    if (env.nodeEnv === 'production') {
        return next(new AppError('No Azure accounts configured for this organisation.', 404, 'NO_CLOUD_ACCOUNTS'));
    }

    logger.warn({ orgId }, 'Serving mock Azure data — not for production use');
    res.status(200).json({ azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown, azureOrphanedResources });
});

export const getGcp = catchAsync(async (req, res, next) => {
    const { orgId } = req;

    if (env.nodeEnv === 'production') {
        const accounts = await CloudAccount.find({ orgId, provider: 'gcp' });
        if (!accounts?.length) {
            return next(new AppError('No GCP accounts configured for this organisation.', 404, 'NO_CLOUD_ACCOUNTS'));
        }
    }

    logger.warn({ orgId }, 'Serving mock GCP data — not for production use');
    res.status(200).json({ gcpProjects, gcpServiceBreakdown, gcpRegionBreakdown, gcpCommittedUseDiscounts, gcpOrphanedResources });
});

/**
 * POST /api/v1/cloud/connect
 *
 * Connects a cloud account to the authenticated org.
 * orgId and teamId come from the JWT payload — never trust request body for these.
 */
export const connectCloudAccount = catchAsync(async (req, res, next) => {
    const { provider, name, accountId, credentials } = req.body;
    const { orgId, teamId } = req;

    if (!provider || !name || !credentials) {
        return next(new AppError('Provider, name, and credentials are required.', 400, 'MISSING_FIELDS'));
    }

    const resolvedAccountId = accountId || name;

    // Upsert within org scope — updating credentials if account already connected
    let account = await CloudAccount.findOne({ orgId, provider, accountId: resolvedAccountId });

    if (account) {
        account.credentials = credentials;
        account.name = name;
        await account.save();
    } else {
        account = await CloudAccount.create({
            orgId,
            teamId,
            provider,
            name,
            accountId: resolvedAccountId,
            credentials,
            status: 'active',
        });
    }

    await logAction({
        orgId,
        teamId,
        userId: req.user?.id,
        action: 'cloud_account_connected',
        category: 'cloud',
        details: { provider, name, accountId: resolvedAccountId },
    });

    res.status(201).json({ success: true, data: account });
});
