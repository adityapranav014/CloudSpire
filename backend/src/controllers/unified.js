import { UNIFIED_SCHEMA_FIELDS, dailySpend, monthlySpend, currentMonthStats, tagBreakdown } from '../data/mockUnified.js';

export const getIndex = async (req, res, next) => {
    try {
        res.status(200).json({ UNIFIED_SCHEMA_FIELDS, dailySpend, monthlySpend, currentMonthStats, tagBreakdown });
    } catch (error) { next(error); }
};
