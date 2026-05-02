import { awsAccounts, awsServiceBreakdown, awsEC2Instances, awsOrphanedResources, awsRegionBreakdown } from '../data/mockAWS.js';
import { azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown, azureOrphanedResources } from '../data/mockAzure.js';
import { gcpProjects, gcpServiceBreakdown, gcpRegionBreakdown, gcpCommittedUseDiscounts, gcpOrphanedResources } from '../data/mockGCP.js';

export const getAws = async (req, res, next) => {
    try {
        res.status(200).json({ awsAccounts, awsServiceBreakdown, awsEC2Instances, awsOrphanedResources, awsRegionBreakdown });
    } catch (error) { next(error); }
};

export const getAzure = async (req, res, next) => {
    try {
        res.status(200).json({ azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown, azureOrphanedResources });
    } catch (error) { next(error); }
};

export const getGcp = async (req, res, next) => {
    try {
        res.status(200).json({ gcpProjects, gcpServiceBreakdown, gcpRegionBreakdown, gcpCommittedUseDiscounts, gcpOrphanedResources });
    } catch (error) { next(error); }
};
