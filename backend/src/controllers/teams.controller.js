import Team from '../models/Team.model.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getIndex = catchAsync(async (req, res, next) => {
    // Phase 1 Multi-tenancy: extract teamId/ownerId from req.user
    // const ownerId = req.user.id;
    const teams = await Team.find();
    res.status(200).json({ success: true, data: { teams } });
});

export const createTeam = catchAsync(async (req, res, next) => {
    const { name, budget, currency } = req.body;

    if (!name) {
        return next(new AppError('Team name is required.', 400, 'MISSING_FIELDS'));
    }

    // Mock owner for phase 1 until Auth is ready
    const newTeam = await Team.create({
        name,
        budget,
        currency,
        ownerId: '000000000000000000000000'
    });
    res.status(201).json({ success: true, data: { team: newTeam } });
});

export const updateTeam = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const updatedTeam = await Team.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!updatedTeam) {
        return next(new AppError('Team not found.', 404, 'NOT_FOUND'));
    }

    res.status(200).json({ success: true, data: { team: updatedTeam } });
});
