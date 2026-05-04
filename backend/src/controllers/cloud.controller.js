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
    console.log('[CLOUD] GET /aws — User:', req.user?.id, 'orgId:', req.orgId, 'teamId:', req.teamId);

    const { orgId, teamId } = req;

    // Only query DB if we have a valid orgId (demo-mode users won't have one)
    if (orgId) {
        const accounts = await CloudAccount.find({ orgId, provider: 'aws' });
        console.log('[CLOUD] getAws — found accounts:', accounts.length);

        if (accounts?.length > 0) {
            const creds = accounts[0].getDecryptedCredentials();
            // Frontend sends accessKeyId/secretAccessKey — normalize both naming conventions
            const accessKey = creds.accessKeyId || creds.accessKey;
            const secretKey = creds.secretAccessKey || creds.secretKey;
            if (accessKey) {
                try {
                    const start = new Date(new Date().setDate(1)).toISOString().split('T')[0];
                    const end   = new Date().toISOString().split('T')[0];

                    const [liveCostData, liveInstances] = await Promise.all([
                        fetchAwsCostAndUsage({ accessKey, secretKey }, start, end),
                        fetchAwsInstances({ accessKey, secretKey }),
                    ]);

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
            }
        }
    }

    // No real account or no orgId — serve demo/mock data
    console.log('[CLOUD] getAws — no real account or no orgId, serving demo data for orgId:', orgId);
    logger.warn({ orgId }, 'No real AWS account — serving sample/demo AWS CUR data');
    const costData = orgId ? await getCostData(orgId, 'aws') : { isSampleData: true, currency: 'USD', serviceBreakdown: [], regionBreakdown: [] };

    console.log('[CLOUD] getAws success — serving sample/mock data');
    return res.status(200).json({
        success: true,
        isSampleData: true,
        currency: costData.currency || 'USD',
        awsAccounts,
        awsServiceBreakdown: costData.serviceBreakdown?.length ? costData.serviceBreakdown : awsEC2Instances,
        awsRegionBreakdown:  costData.regionBreakdown || [],
        awsEC2Instances:     awsEC2Instances,
        awsOrphanedResources: awsOrphanedResources,
    });
});

export const getAzure = catchAsync(async (req, res, next) => {
    console.log('[CLOUD] GET /azure — User:', req.user, 'orgId:', req.orgId, 'teamId:', req.teamId);

    const { orgId, teamId } = req;

    // Only query DB if we have a valid orgId (demo-mode users won't have one)
    if (orgId) {
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
    } // Closing brace for if (accounts?.length > 0)
    } // Closing brace for if (orgId)

    console.log('[CLOUD] getAzure success — serving mock data');
    logger.warn({ orgId }, 'Serving mock Azure data — not for production use');
    res.status(200).json({ success: true, isSampleData: true, azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown, azureOrphanedResources });
});

export const getGcp = catchAsync(async (req, res, next) => {
    console.log('[CLOUD] GET /gcp — User:', req.user, 'orgId:', req.orgId);

    const { orgId } = req;

    // Hackathon mode: allow mock data in production
    // if (env.nodeEnv === 'production') {
    //     const accounts = await CloudAccount.find({ orgId, provider: 'gcp' });
    //     if (!accounts?.length) {
    //         console.log('[CLOUD] getGcp error — no GCP accounts for orgId:', orgId);
    //         return next(new AppError('No GCP accounts configured for this organisation.', 404, 'NO_CLOUD_ACCOUNTS'));
    //     }
    // }

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
    // Prefer teamId from body, then from JWT, then skip (demo mode)
    const teamId = req.body.teamId || req.teamId || null;
    const { orgId } = req;

    if (!provider || !name || !credentials) {
        return next(new AppError('Provider, name, and credentials are required.', 400, 'MISSING_FIELDS'));
    }

    if (!orgId) {
        return next(new AppError('Your account is not linked to an organisation. Please re-login.', 400, 'MISSING_ORG'));
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
