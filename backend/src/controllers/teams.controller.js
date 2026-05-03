import Team from '../models/Team.model.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { teams as mockTeams } from '../data/mockTeams.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const getIndex = catchAsync(async (req, res) => {
    const { orgId } = req;
    const teams = await Team.find({ orgId });

    if (env.nodeEnv !== 'production' && teams.length === 0) {
        logger.warn({ orgId }, 'Serving mock teams data — not for production use');
        return res.status(200).json({ success: true, data: { teams: mockTeams } });
    }

    res.status(200).json({ success: true, data: { teams } });
});

export const createTeam = catchAsync(async (req, res, next) => {
    const { name, monthlyBudget, currency } = req.body;
    const { orgId } = req;

    if (!name) {
        return next(new AppError('Team name is required.', 400, 'MISSING_FIELDS'));
    }

    const newTeam = await Team.create({
        orgId,
        name,
        monthlyBudget,
        currency,
        ownerId: req.user.id,
    });

    res.status(201).json({ success: true, data: { team: newTeam } });
});

export const updateTeam = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { orgId } = req;

    // findOneAndUpdate with orgId — prevents cross-tenant team modification
    const updatedTeam = await Team.findOneAndUpdate(
        { _id: id, orgId },
        req.body,
        { new: true, runValidators: true }
    );

    if (!updatedTeam) {
        return next(new AppError('Team not found.', 404, 'NOT_FOUND'));
    }

    res.status(200).json({ success: true, data: { team: updatedTeam } });
});
