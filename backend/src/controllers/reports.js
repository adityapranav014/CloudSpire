import { mockReports } from '../data/mockReports.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { generateStandardReport } from '../jobs/reportWorker.js';

export const getReports = catchAsync(async (_req, res) => {
    res.status(200).json({
        success: true,
        data: mockReports,
    });
});

export const triggerReportGeneration = catchAsync(async (req, res, next) => {
    const { format } = req.body;
    const teamId = req.user?.teamId || '000000000000000000000000';

    if (!format) {
        return next(new AppError('Report format is required (csv or json).', 400, 'MISSING_FIELDS'));
    }

    if (!['csv', 'json'].includes(format)) {
        return next(new AppError(`Unsupported format "${format}". Use "csv" or "json".`, 400, 'INVALID_FORMAT'));
    }

    // In a prod system like ClickHouse, we'd enqueue a BullMQ job here instead
    // But since this is a transition prototype, we kick off an async task gracefully in Node Event Loop
    generateStandardReport(teamId, format).catch(e => console.error("Worker process failure:", e));

    res.status(202).json({
        success: true,
        data: {
            message: "Report generation started. We will notify you when it's ready.",
            status: "processing"
        }
    });
});