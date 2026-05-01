import { optimizationSummary, rightsizingRecommendations, reservedInstanceOpportunities, scheduledShutdowns } from '../data/mockOptimizations.js';

export const getIndex = async (req, res, next) => {
    try {
        res.status(200).json({ optimizationSummary, rightsizingRecommendations, reservedInstanceOpportunities, scheduledShutdowns });
    } catch (error) { next(error); }
};
