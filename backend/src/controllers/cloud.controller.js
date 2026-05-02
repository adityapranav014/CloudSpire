import CloudAccount from '../models/CloudAccount.js';
import { fetchAwsCostAndUsage, fetchAwsInstances } from '../services/awsService.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logAction } from '../services/auditService.js';

import { awsAccounts, awsServiceBreakdown, awsEC2Instances, awsOrphanedResources, awsRegionBreakdown } from '../data/mockAWS.js';
import { azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown, azureOrphanedResources } from '../data/mockAzure.js';
import { gcpProjects, gcpServiceBreakdown, gcpRegionBreakdown, gcpCommittedUseDiscounts, gcpOrphanedResources } from '../data/mockGCP.js';

export const getAws = catchAsync(async (req, res, next) => {
    // 1. Find AWS cloud accounts for this team (mock team fallback for now)
    const teamId = req.query.teamId || '000000000000000000000000';
    const accounts = await CloudAccount.find({ teamId, provider: 'aws' });

    // 2. If we have real AWS accounts with credentials, fetch live data
    if (accounts && accounts.length > 0 && accounts[0].credentials?.accessKey) {
        try {
            // Setup dynamic date ranges for this month
            const start = new Date(new Date().setDate(1)).toISOString().split('T')[0];
            const end = new Date().toISOString().split('T')[0];

            // This is synchronous real-time fetch as per the new plan
            const liveCostData = await fetchAwsCostAndUsage(accounts[0].credentials, start, end);
            const liveInstances = await fetchAwsInstances(accounts[0].credentials);

            // Shape live data to match frontend requirements here...
            // Note: For prototype continuity, returning live data mapping is complex.
            // Sending back a structured envelope here.
            return res.status(200).json({
                success: true,
                data: {
                    awsAccounts: accounts,
                    awsServiceBreakdown: liveCostData.ResultsByTime, // Needs mapping in a full implementation
                    awsEC2Instances: liveInstances,
                    awsOrphanedResources: [],
                    awsRegionBreakdown: []
                }
            });
        } catch (error) {
            console.error("Failed real AWS sync, falling back to mock:", error.message);
            // Fall through to mock data gracefully
        }
    }

    // 3. Fallback returning mock data so the UI doesn't crash during transition
    res.status(200).json({ awsAccounts, awsServiceBreakdown, awsEC2Instances, awsOrphanedResources, awsRegionBreakdown });
});

export const getAzure = catchAsync(async (req, res, next) => {
    res.status(200).json({ azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown, azureOrphanedResources });
});

export const getGcp = catchAsync(async (req, res, next) => {
    res.status(200).json({ gcpProjects, gcpServiceBreakdown, gcpRegionBreakdown, gcpCommittedUseDiscounts, gcpOrphanedResources });
});

export const connectCloudAccount = catchAsync(async (req, res, next) => {
    const { provider, name, accountId, credentials } = req.body;
    // req.user logic comes from auth middleware. We fall back to dummy team for prototype
    const teamId = req.user?.teamId || '000000000000000000000000';

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
