import Team from '../models/Team.model.js';
import User from '../models/User.model.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { teams as mockTeams } from '../data/mockTeams.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const getIndex = catchAsync(async (req, res) => {
    console.log('[TEAMS] GET /teams — User:', req.user, 'orgId:', req.orgId);

    const { orgId } = req;
    const teams = await Team.find({ orgId })
        .populate('members', 'name email role')
        .populate('createdBy', 'name email');
    console.log('[TEAMS] getIndex — found teams:', teams.length);

    if (env.nodeEnv !== 'production' && teams.length === 0) {
        console.log('[TEAMS] getIndex — no teams in DB, serving mock data');
        logger.warn({ orgId }, 'Serving mock teams data — not for production use');
        return res.status(200).json({ success: true, data: { teams: mockTeams } });
    }

    console.log('[TEAMS] getIndex success — count:', teams.length);
    res.status(200).json({ success: true, data: { teams } });
});

export const createTeam = catchAsync(async (req, res, next) => {
    console.log('[TEAMS] POST /teams — User:', req.user, 'Body:', req.body);

    const { name, description, monthlyBudget, currency } = req.body;
    const { orgId } = req;

    if (!name) {
        console.log('[TEAMS] createTeam error: Missing team name');
        return next(new AppError('Team name is required.', 400, 'MISSING_FIELDS'));
    }

    try {
        const newTeam = await Team.create({
            orgId,
            name,
            description,
            monthlyBudget,
            currency,
            createdBy: req.user.id,
        });

        console.log('[TEAMS] createTeam success — teamId:', newTeam._id, 'name:', name);
        res.status(201).json({ success: true, data: { team: newTeam } });
    } catch (error) {
        if (error.code === 11000) {
            console.log('[TEAMS] createTeam error: Duplicate team name —', name);
            return next(new AppError('A team with this name already exists.', 409, 'DUPLICATE_TEAM'));
        }
        return next(error);
    }
});

export const updateTeam = catchAsync(async (req, res, next) => {
    console.log('[TEAMS] PUT /teams/:id — Params:', req.params, 'Body:', req.body, 'User:', req.user);

    const { id } = req.params;
    const { orgId } = req;

    // findOneAndUpdate with orgId — prevents cross-tenant team modification
    const updatedTeam = await Team.findOneAndUpdate(
        { _id: id, orgId },
        req.body,
        { new: true, runValidators: true }
    );

    if (!updatedTeam) {
        console.log('[TEAMS] updateTeam error: Team not found — id:', id, 'orgId:', orgId);
        return next(new AppError('Team not found.', 404, 'NOT_FOUND'));
    }

    console.log('[TEAMS] updateTeam success — teamId:', updatedTeam._id);
    res.status(200).json({ success: true, data: { team: updatedTeam } });
});

export const getTeamById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { orgId } = req;

    const team = await Team.findOne({ _id: id, orgId })
        .populate('members', 'name email role')
        .populate('createdBy', 'name email');

    if (!team) {
        return next(new AppError('Team not found.', 404, 'NOT_FOUND'));
    }

    res.status(200).json({ success: true, data: { team } });
});

export const addMember = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { userId } = req.body;
    const { orgId } = req;

    if (!userId) {
        return next(new AppError('User ID is required.', 400, 'MISSING_FIELDS'));
    }

    // Validate that the user exists in the org
    const user = await User.findOne({ _id: userId, orgId });
    if (!user) {
        return next(new AppError('User not found or does not belong to this organisation.', 404, 'USER_NOT_FOUND'));
    }

    const updatedTeam = await Team.findOneAndUpdate(
        { _id: id, orgId },
        { $addToSet: { members: userId } },
        { new: true, runValidators: true }
    )
        .populate('members', 'name email role')
        .populate('createdBy', 'name email');

    if (!updatedTeam) {
        return next(new AppError('Team not found.', 404, 'TEAM_NOT_FOUND'));
    }

    res.status(200).json({ success: true, data: { team: updatedTeam } });
});
