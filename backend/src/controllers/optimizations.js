import { optimizationSummary, rightsizingRecommendations, reservedInstanceOpportunities, scheduledShutdowns } from '../data/mockOptimizations.js';

export const getIndex = async (req, res, next) => {
    try {
        res.status(200).json({ optimizationSummary, rightsizingRecommendations, reservedInstanceOpportunities, scheduledShutdowns });
    } catch (error) { next(error); }
};

export const updateSchedule = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;
        const schedule = scheduledShutdowns.find(s => s.id === id);
        if (schedule) {
            schedule.enabled = enabled;
            res.status(200).json({ message: "Schedule updated", schedule });
        } else {
            res.status(404).json({ message: "Schedule not found" });
        }
    } catch (error) { next(error); }
};
