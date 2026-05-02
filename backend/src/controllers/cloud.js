import CloudAccount from '../models/CloudAccount.js';
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
    const teamId = req.user.teamId;
    const accounts = await CloudAccount.find({ teamId, provider: 'aws' });

    if (accounts && accounts.length > 0 && accounts[0].credentials?.accessKey) {
        try {
            const start = new Date(new Date().setDate(1)).toISOString().split('T')[0];
            const end = new Date().toISOString().split('T')[0];

            const liveCostData = await fetchAwsCostAndUsage(accounts[0].credentials, start, end);
            const liveInstances = await fetchAwsInstances(accounts[0].credentials);

            return res.status(200).json({
                success: true,
                data: {
                    awsAccounts: accounts,
                    awsServiceBreakdown: liveCostData.ResultsByTime,
                    awsEC2Instances: liveInstances,
                    awsOrphanedResources: [],
                    awsRegionBreakdown: []
                }
            });
        } catch (error) {
            logger.warn({ err: error, teamId }, 'Failed real AWS sync, falling back to mock data');
        }
    }

    if (env.nodeEnv === 'production') {
        return next(new AppError('No cloud accounts configured for this team.', 404, 'NO_CLOUD_ACCOUNTS'));
    }

    logger.warn({ teamId }, 'Serving mock AWS data — not for production use');
    res.status(200).json({ awsAccounts, awsServiceBreakdown, awsEC2Instances, awsOrphanedResources, awsRegionBreakdown });
});

export const getAzure = catchAsync(async (req, res, next) => {
    const teamId = req.user.teamId;
    const accounts = await CloudAccount.find({ teamId, provider: 'azure' });

    if (accounts && accounts.length > 0 && accounts[0].credentials?.tenantId) {
        try {
            const start = new Date(new Date().setDate(1)).toISOString().split('T')[0];
            const end = new Date().toISOString().split('T')[0];

            const liveCostData = await fetchAzureCostAndUsage(accounts[0].credentials, start, end);
            const liveVMs = await fetchAzureVMs(accounts[0].credentials);

            return res.status(200).json({
                success: true,
                data: {
                    azureSubscriptions: accounts,
                    azureServiceBreakdown: liveCostData,
                    azureVMs: liveVMs,
                    azureRegionBreakdown: [],
                    azureOrphanedResources: []
                }
            });
        } catch (error) {
            logger.warn({ err: error, teamId }, 'Failed real Azure sync, falling back to mock data');
        }
    }

    if (env.nodeEnv === 'production') {
        return next(new AppError('No cloud accounts configured for this team.', 404, 'NO_CLOUD_ACCOUNTS'));
    }

    logger.warn({ teamId }, 'Serving mock Azure data — not for production use');
    res.status(200).json({ azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown, azureOrphanedResources });
});

export const getGcp = catchAsync(async (req, res, next) => {
    if (env.nodeEnv === 'production') {
        const teamId = req.user.teamId;
        const accounts = await CloudAccount.find({ teamId, provider: 'gcp' });
        if (!accounts || accounts.length === 0) {
            return next(new AppError('No cloud accounts configured for this team.', 404, 'NO_CLOUD_ACCOUNTS'));
        }
    }
    if (env.nodeEnv !== 'production') {
        logger.warn({ teamId: req.user.teamId }, 'Serving mock GCP data — not for production use');
    }
    res.status(200).json({ gcpProjects, gcpServiceBreakdown, gcpRegionBreakdown, gcpCommittedUseDiscounts, gcpOrphanedResources });
});

export const connectCloudAccount = catchAsync(async (req, res, next) => {
    const { provider, name, accountId, credentials } = req.body;
    const teamId = req.user.teamId;

    // Validation via AppError
    if (!provider || !name || !credentials) {
        return next(new AppError('Provider, name, and credentials are required.', 400, 'MISSING_FIELDS'));
    }

    // Ideally, validate credentials via SDK here before saving
    // Example: fetchAwsInstances(credentials) to verify keys. Or just save and wait for sync.

    // Check if account already exists
    let existingAccount = await CloudAccount.findOne({ teamId, provider, accountId: accountId || name });

    if (existingAccount) {
        existingAccount.credentials = credentials;
        existingAccount.name = name;
        await existingAccount.save();
    } else {
        existingAccount = await CloudAccount.create({
            teamId,
            provider,
            name,
            accountId: accountId || name, // Fallback account ID if not provided explicitly
            credentials,
            status: 'active'
        });
    }

    // Add Audit Log
    await logAction({
        teamId,
        userId: req.user?.id,
        action: 'cloud_account_connected',
        category: 'cloud',
        details: { provider, name, accountId }
    });

    res.status(201).json({
        success: true,
        data: existingAccount
    });
});
