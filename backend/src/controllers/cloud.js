import CloudAccount from '../models/CloudAccount.js';
import CostRecord from '../models/CostRecord.js';
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

/**
 * Persist cost records from a cloud billing response into MongoDB.
 * Silently skips on any error so the main response is never blocked.
 */
async function persistCostRecords(teamId, cloudAccountId, provider, resultsByTime = []) {
    try {
        const ops = [];
        for (const day of resultsByTime) {
            const date = new Date(day.TimePeriod?.Start || day.date || Date.now());
            const groups = day.Groups || [];

            // When there are no groups, the total comes from Total.UnblendedCost
            if (groups.length === 0 && day.Total?.UnblendedCost) {
                ops.push({
                    updateOne: {
                        filter: { teamId, cloudAccountId, provider, date, service: 'Total', region: 'global' },
                        update: {
                            $set: {
                                cost: parseFloat(day.Total.UnblendedCost.Amount || 0),
                                currency: day.Total.UnblendedCost.Unit || 'USD',
                            },
                        },
                        upsert: true,
                    },
                });
            }

            for (const group of groups) {
                const service = group.Keys?.[0] || 'Unknown';
                const amount = parseFloat(group.Metrics?.UnblendedCost?.Amount || 0);
                ops.push({
                    updateOne: {
                        filter: { teamId, cloudAccountId, provider, date, service, region: 'global' },
                        update: {
                            $set: {
                                cost: amount,
                                currency: group.Metrics?.UnblendedCost?.Unit || 'USD',
                            },
                        },
                        upsert: true,
                    },
                });
            }
        }

        if (ops.length > 0) {
            await CostRecord.bulkWrite(ops, { ordered: false });
            logger.info({ teamId, provider, count: ops.length }, 'Cost records persisted');
        }
    } catch (err) {
        logger.error({ err, teamId, provider }, 'Failed to persist cost records — continuing without save');
    }
}

export const getAws = catchAsync(async (req, res, next) => {
    const teamId = req.user.teamId;
    const accounts = await CloudAccount.find({ teamId, provider: 'aws' });

    if (accounts && accounts.length > 0 && accounts[0].credentials?.accessKey) {
        try {
            const start = new Date(new Date().setDate(1)).toISOString().split('T')[0];
            const end = new Date().toISOString().split('T')[0];

            const liveCostData = await fetchAwsCostAndUsage(accounts[0].credentials, start, end);
            const liveInstances = await fetchAwsInstances(accounts[0].credentials);

            // Persist to DB (non-blocking)
            persistCostRecords(teamId, accounts[0]._id, 'aws', liveCostData.ResultsByTime);

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

            // Persist to DB — Azure returns an array of rows, wrap for persistCostRecords compatibility
            const normalised = (liveCostData || []).map(row => ({
                TimePeriod: { Start: row[1] || new Date().toISOString().split('T')[0] },
                Groups: [{ Keys: [row[2] || 'Unknown'], Metrics: { UnblendedCost: { Amount: row[0] || 0, Unit: 'USD' } } }],
            }));
            persistCostRecords(teamId, accounts[0]._id, 'azure', normalised);

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
    // Fix: declare teamId before any conditional block to avoid ReferenceError
    const teamId = req.user.teamId;

    if (env.nodeEnv === 'production') {
        const accounts = await CloudAccount.find({ teamId, provider: 'gcp' });
        if (!accounts || accounts.length === 0) {
            return next(new AppError('No cloud accounts configured for this team.', 404, 'NO_CLOUD_ACCOUNTS'));
        }
    }

    if (env.nodeEnv !== 'production') {
        logger.warn({ teamId }, 'Serving mock GCP data — not for production use');
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
            accountId: accountId || name,
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
