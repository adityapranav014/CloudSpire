import CloudAccount from '../models/CloudAccount.js';
import { persistCostRecords, getCostData } from '../services/costService.js';
import { fetchAwsCostAndUsage, fetchAwsInstances } from '../services/awsService.js';
import { fetchAzureCostAndUsage, fetchAzureVMs } from '../services/azureService.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logAction } from '../services/auditService.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

import { awsAccounts, awsEC2Instances, awsOrphanedResources } from '../data/mockAWS.js';
import { azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown, azureOrphanedResources } from '../data/mockAzure.js';
import { gcpProjects, gcpServiceBreakdown, gcpRegionBreakdown, gcpCommittedUseDiscounts, gcpOrphanedResources } from '../data/mockGCP.js';

export const getAws = catchAsync(async (req, res, next) => {
    console.log('[CLOUD] GET /aws — User:', req.user, 'orgId:', req.orgId, 'teamId:', req.teamId);

    const { orgId, teamId } = req;
    const accounts = await CloudAccount.find({ orgId, provider: 'aws' });
    console.log('[CLOUD] getAws — found accounts:', accounts.length);

    if (accounts?.length > 0) {
        const creds = accounts[0].getDecryptedCredentials();
        if (creds.accessKey) {
            try {
                const start = new Date(new Date().setDate(1)).toISOString().split('T')[0];
                const end   = new Date().toISOString().split('T')[0];

                const [liveCostData, liveInstances] = await Promise.all([
                    fetchAwsCostAndUsage(creds, start, end),
                    fetchAwsInstances(creds),
                ]);

            // Persist to DB — non-blocking, passes orgId for proper scoping
            persistCostRecords(orgId, teamId, accounts[0]._id, 'aws', liveCostData.ResultsByTime);

            console.log('[CLOUD] getAws success — live data from AWS');
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
            console.error('[CLOUD] getAws error — live AWS sync failed:', error.message);
            logger.warn({ err: error, orgId }, 'Failed real AWS sync, falling back to mock data');
        }
        } // Closing brace for if (creds.accessKey)
    }

    // No real account — serve AWS CUR sample data (or mock in dev)
    if (env.nodeEnv === 'production') {
        console.log('[CLOUD] getAws error — no AWS accounts configured for orgId:', orgId);
        return next(new AppError('No AWS accounts configured for this organisation.', 404, 'NO_CLOUD_ACCOUNTS'));
    }

    // In dev mode: use getCostData() which transparently serves sample data
    // (if the CSV was downloaded) or falls back to empty data.
    logger.warn({ orgId }, 'No real AWS account — serving sample/demo AWS CUR data');
    const costData = await getCostData(orgId, 'aws');

    console.log('[CLOUD] getAws success — serving sample/mock data, isSampleData:', costData.isSampleData);
    return res.status(200).json({
        success: true,
        isSampleData: costData.isSampleData,
        currency: costData.currency,
        awsAccounts,                                      // UI still needs account list shape
        awsServiceBreakdown: costData.serviceBreakdown,  // from real CUR CSV (not mocked)
        awsRegionBreakdown:  costData.regionBreakdown,
        awsEC2Instances:     awsEC2Instances,             // instance data stays mocked until connector built
        awsOrphanedResources: awsOrphanedResources,
    });
});

export const getAzure = catchAsync(async (req, res, next) => {
    console.log('[CLOUD] GET /azure — User:', req.user, 'orgId:', req.orgId, 'teamId:', req.teamId);

    const { orgId, teamId } = req;
    const accounts = await CloudAccount.find({ orgId, provider: 'azure' });
    console.log('[CLOUD] getAzure — found accounts:', accounts.length);

    if (accounts?.length > 0) {
        const creds = accounts[0].getDecryptedCredentials();
        if (creds.tenantId) {
            try {
                const start = new Date(new Date().setDate(1)).toISOString().split('T')[0];
                const end   = new Date().toISOString().split('T')[0];

                const [liveCostData, liveVMs] = await Promise.all([
                    fetchAzureCostAndUsage(creds, start, end),
                    fetchAzureVMs(creds),
                ]);

            const normalised = (liveCostData || []).map(row => ({
                TimePeriod: { Start: row[1] || new Date().toISOString().split('T')[0] },
                Groups: [{ Keys: [row[2] || 'Unknown'], Metrics: { UnblendedCost: { Amount: row[0] || 0, Unit: 'USD' } } }],
            }));
            persistCostRecords(orgId, teamId, accounts[0]._id, 'azure', normalised);

            console.log('[CLOUD] getAzure success — live data from Azure');
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
            console.error('[CLOUD] getAzure error — live Azure sync failed:', error.message);
            logger.warn({ err: error, orgId }, 'Failed real Azure sync, falling back to mock data');
        }
        } // Closing brace for if (creds.tenantId)
    }

    if (env.nodeEnv === 'production') {
        console.log('[CLOUD] getAzure error — no Azure accounts configured for orgId:', orgId);
        return next(new AppError('No Azure accounts configured for this organisation.', 404, 'NO_CLOUD_ACCOUNTS'));
    }

    console.log('[CLOUD] getAzure success — serving mock data');
    logger.warn({ orgId }, 'Serving mock Azure data — not for production use');
    res.status(200).json({ azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown, azureOrphanedResources });
});

export const getGcp = catchAsync(async (req, res, next) => {
    console.log('[CLOUD] GET /gcp — User:', req.user, 'orgId:', req.orgId);

    const { orgId } = req;

    if (env.nodeEnv === 'production') {
        const accounts = await CloudAccount.find({ orgId, provider: 'gcp' });
        if (!accounts?.length) {
            console.log('[CLOUD] getGcp error — no GCP accounts for orgId:', orgId);
            return next(new AppError('No GCP accounts configured for this organisation.', 404, 'NO_CLOUD_ACCOUNTS'));
        }
    }

    console.log('[CLOUD] getGcp success — serving mock data');
    logger.warn({ orgId }, 'Serving mock GCP data — not for production use');
    res.status(200).json({ gcpProjects, gcpServiceBreakdown, gcpRegionBreakdown, gcpCommittedUseDiscounts, gcpOrphanedResources });
});

/**
 * POST /api/v1/cloud/connect
 *
 * Connects a cloud account to the authenticated org.
 * orgId and teamId come from the JWT payload — never trust request body for these.
 */
import { encrypt } from '../services/encryptionService.js';

export const connectCloudAccount = catchAsync(async (req, res, next) => {
    const { provider, name, credentials } = req.body;
    // Allow teamId from body OR from the JWT (orgScope middleware injects req.teamId)
    const teamId = req.body.teamId || req.teamId;
    const { orgId } = req;

    if (!provider || !name || !credentials) {
        return next(new AppError('Provider, name, and credentials are required.', 400, 'MISSING_FIELDS'));
    }

    if (!teamId) {
        return next(new AppError('Team context is required. Ensure your account is assigned to a team.', 400, 'MISSING_TEAM'));
    }

    // Encrypt all values in credentials object
    const encryptedCredentials = {};
    for (const [key, value] of Object.entries(credentials)) {
        if (typeof value === 'string' && value.trim() !== '') {
            encryptedCredentials[key] = encrypt(value);
        }
    }

    const account = await CloudAccount.create({
        orgId,
        team: teamId,
        provider,
        name,
        credentials: encryptedCredentials,
        addedBy: req.user.id,
        isActive: true,
    });

    await logAction({
        orgId,
        userId: req.user?.id,
        action: 'cloud_account_connected',
        category: 'cloud',
        details: { provider, name },
    });

    res.status(201).json({ 
        success: true, 
        data: {
            _id: account._id,
            provider: account.provider,
            name: account.name,
            team: account.team,
            isActive: account.isActive,
            connectedAt: account.createdAt,
        }
    });
});

export const getCloudAccounts = catchAsync(async (req, res, next) => {
    const { orgId } = req;
    
    let query = { orgId, isActive: true };
    // Filter by team if user is not admin/manager
    if (req.user.role !== 'super_admin' && req.user.role !== 'finops_manager') {
        query.team = req.teamId; // User's assigned team
    }

    // Fetch accounts, explicitly omitting credentials
    const accounts = await CloudAccount.find(query).select('-credentials').populate('team', 'name').populate('addedBy', 'name email');

    res.status(200).json({ success: true, data: { accounts } });
});

export const deleteCloudAccount = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { orgId } = req;

    const account = await CloudAccount.findOneAndUpdate(
        { _id: id, orgId },
        { isActive: false },
        { new: true }
    ).select('-credentials');

    if (!account) {
        return next(new AppError('Cloud account not found.', 404, 'NOT_FOUND'));
    }

    await logAction({
        orgId,
        userId: req.user?.id,
        action: 'cloud_account_deleted',
        category: 'cloud',
        details: { provider: account.provider, name: account.name },
    });

    res.status(200).json({ success: true, data: { account } });
});
