import Team from '../models/Team.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { teams as mockTeams } from '../data/mockTeams.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const getIndex = catchAsync(async (req, res, next) => {
    const teams = await Team.find();

    // In dev mode, fall back to rich mock data when real teams lack enriched fields
    if (env.nodeEnv !== 'production') {
        const hasRichData = teams.length > 0 && teams[0].monthlySpend !== undefined;
        if (!hasRichData) {
            logger.warn('Serving mock teams data — not for production use');
            return res.status(200).json({ success: true, data: { teams: mockTeams } });
        }
    }

    res.status(200).json({ success: true, data: { teams } });
});

export const createTeam = catchAsync(async (req, res, next) => {
    const { name, budget, currency } = req.body;

    if (!name) {
        return next(new AppError('Team name is required.', 400, 'MISSING_FIELDS'));
    }

    // Use the authenticated user as the owner
    const newTeam = await Team.create({
        name,
        budget,
        currency,
        ownerId: req.user.id
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
