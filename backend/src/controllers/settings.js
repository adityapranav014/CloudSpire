import { mockSettings } from '../data/mockSettings.js';
import { catchAsync } from '../middleware/asyncHandler.js';

export const getSettings = catchAsync(async (_req, res) => {
    res.status(200).json({
        status: 'success',
        data: mockSettings,
    });
});