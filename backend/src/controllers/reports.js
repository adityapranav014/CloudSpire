import { mockReports } from '../data/mockReports.js';
import { catchAsync } from '../middleware/asyncHandler.js';

export const getReports = catchAsync(async (_req, res) => {
    res.status(200).json({
        status: 'success',
        data: mockReports,
    });
});