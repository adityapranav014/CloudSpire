import Alert from '../models/Alert.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getIndex = catchAsync(async (req, res, next) => {
    // In Phase 1 we pull directly from the Mongoose model
    const filter = req.query.teamId ? { teamId: req.query.teamId } : {};
    const anomalies = await Alert.find(filter).sort('-createdAt');

    // Calculate basic anomalyStats dynamically based on the DB 
    const anomalyStats = {
        resolvedThisMonth: anomalies.filter(a => a.status === 'resolved').length,
        spendPrevented: anomalies.filter(a => a.status === 'resolved').reduce((acc, curr) => acc + (curr.actualSpend - curr.expectedSpend || 0), 0)
    };

    // BudgetAlerts and anomalyHistory can either be modeled later or left empty for now to satisfy UI shape
    res.status(200).json({ success: true, data: { anomalies, budgetAlerts: [], anomalyHistory: [], anomalyStats } });
});

export const updateAnomaly = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return next(new AppError('Status field is required.', 400, 'MISSING_FIELDS'));
    }

    const anomaly = await Alert.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

    if (!anomaly) {
        return next(new AppError('Anomaly not found.', 404, 'NOT_FOUND'));
    }

    res.status(200).json({ success: true, data: { anomaly } });
});
