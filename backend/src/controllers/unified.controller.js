import { UNIFIED_SCHEMA_FIELDS, dailySpend, monthlySpend, currentMonthStats, tagBreakdown } from '../data/mockUnified.js';
import { catchAsync } from '../middleware/asyncHandler.js';

export const getIndex = catchAsync(async (req, res, next) => {
    res.status(200).json({ UNIFIED_SCHEMA_FIELDS, dailySpend, monthlySpend, currentMonthStats, tagBreakdown });
});
