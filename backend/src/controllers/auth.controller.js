import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Team from '../models/Team.model.js';
import Org from '../models/Org.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { createSendToken, clearAuthCookie } from '../services/authService.js';
import { logger } from '../utils/logger.js';

async function ensureUserOrgScope(user) {
    const hasValidOrg = user.orgId && await Org.exists({ _id: user.orgId });
    const hasValidTeam = user.teamId && await Team.exists({ _id: user.teamId });

    if (hasValidOrg && hasValidTeam) {
        return user;
    }

    const fallbackOrgName = `${user.name?.trim() || 'CloudSpire'} Workspace`;
    const fallbackTeamName = 'Platform';

    const [org] = await Org.create([{
        name: fallbackOrgName,
        plan: 'starter',
    }]);

    const [team] = await Team.create([{
        orgId: org._id,
        name: fallbackTeamName,
        isDefault: true,
        members: [user._id],
    }]);

    user.orgId = org._id;
    user.teamId = team._id;
    user.onboardingCompleted = true;
    await user.save();

    org.ownerId = user._id;
    await org.save();

    team.ownerId = user._id;
    await team.save();

    logger.info({ userId: user._id, orgId: org._id, teamId: team._id }, 'Backfilled org scope for legacy user');

    return user;
}

/**
 * POST /api/v1/auth/register
 *
 * Registration flow (single MongoDB transaction):
 *   1. Validate inputs + check email uniqueness
 *   2. Create Org   (name derived from company name or user name)
 *   3. Create Team  (default "Platform" team, linked to Org)
 *   4. Create User  (super_admin, linked to both Org + Team)
 *   5. Back-fill Team.ownerId and Org.ownerId with the real User _id
 *   6. Issue JWT — orgId + teamId are embedded in the token payload
 *
 * Exit condition: user.orgId and user.teamId are always set. Dashboard
 * queries will never return empty due to a missing foreign key.
 */
export const register = catchAsync(async (req, res, next) => {
    const { name, email, password, companyName, teamName } = req.body;

    if (!name || !email || !password) {
        return next(new AppError('Name, email, and password are required.', 400, 'MISSING_FIELDS'));
    }

    if (password.length < 8) {
        return next(new AppError('Password must be at least 8 characters.', 400, 'WEAK_PASSWORD'));
    }

    // Check email uniqueness outside the transaction — cheaper read
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
        return next(
            new AppError(
                'An account with this email already exists. Please log in instead.',
                409,
                'DUPLICATE_EMAIL'
            )
        );
    }

    const session = await mongoose.startSession();
    let newUser;

    try {
        await session.withTransaction(async () => {
            // ── Step 1: Create Org ────────────────────────────────────────
            const orgName = companyName?.trim() || `${name.trim()}'s Organisation`;
            const [newOrg] = await Org.create(
                [
                    {
                        name: orgName,
                        plan: 'starter',
                        // ownerId set after User is created
                    },
                ],
                { session }
            );

            // ── Step 2: Create default Team ───────────────────────────────
            const resolvedTeamName = teamName?.trim() || 'Platform';
            const [newTeam] = await Team.create(
                [
                    {
                        orgId: newOrg._id,
                        name: resolvedTeamName,
                        isDefault: true,
                        // ownerId set after User is created
                    },
                ],
                { session }
            );

            // ── Step 3: Create User ───────────────────────────────────────
            [newUser] = await User.create(
                [
                    {
                        orgId: newOrg._id,
                        teamId: newTeam._id,
                        name: name.trim(),
                        email: email.toLowerCase().trim(),
                        password,
                        role: 'super_admin', // First user in any org is always the Admin
                        onboardingCompleted: false,
                    },
                ],
                { session }
            );

            // ── Step 4: Back-fill owner references ───────────────────────
            await Promise.all([
                Org.findByIdAndUpdate(newOrg._id, { ownerId: newUser._id }, { session }),
                Team.findByIdAndUpdate(
                    newTeam._id,
                    { ownerId: newUser._id, members: [newUser._id] },
                    { session }
                ),
            ]);
        });
    } catch (err) {
        logger.error({ err }, 'Registration transaction failed');
        // Let the transaction roll back (session.withTransaction handles this)
        throw err; // Re-throw so catchAsync → errorHandler can format it
    } finally {
        session.endSession();
    }

    logger.info({ userId: newUser._id, orgId: newUser.orgId }, 'New user registered');
    createSendToken(newUser, 201, res);
});

/**
 * POST /api/v1/auth/login
 */
export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password.', 400, 'MISSING_FIELDS'));
    }

    // password has select:false — must explicitly include it
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Incorrect email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    if (!user.isActive) {
        return next(new AppError('Your account has been deactivated. Contact your admin.', 403, 'ACCOUNT_INACTIVE'));
    }

    const scopedUser = await ensureUserOrgScope(user);

    // Update lastLogin — non-blocking, don't await
    User.findByIdAndUpdate(scopedUser._id, { lastLogin: new Date() }).catch((err) =>
        logger.warn({ err, userId: user._id }, 'Failed to update lastLogin')
    );

    createSendToken(scopedUser, 200, res);
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's public profile.
 */
export const getMe = catchAsync(async (req, res, next) => {
    // req.user is set by the protect middleware (only has _id at that point)
    const user = await User.findById(req.user.id).populate('orgId', 'name plan').populate('teamId', 'name');

    if (!user) {
        return next(new AppError('User account no longer exists.', 404, 'USER_NOT_FOUND'));
    }

    const scopedUser = await ensureUserOrgScope(user);

    createSendToken(scopedUser, 200, res);
});

/**
 * POST /api/v1/auth/logout
 * Clears the httpOnly auth cookie server-side.
 * The browser purges the cookie immediately on receiving this response.
 */
export const logout = catchAsync(async (req, res) => {
    clearAuthCookie(res);
    res.status(200).json({ success: true, data: null });
});


/**
 * POST /api/v1/auth/refresh
 * Re-issues a token for the currently authenticated user.
 * The protect middleware has already verified the incoming token.
 */
export const refreshToken = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) {
        return next(new AppError('User not found or inactive.', 401, 'USER_NOT_FOUND'));
    }
    const scopedUser = await ensureUserOrgScope(user);
    createSendToken(scopedUser, 200, res);
});

/**
 * PATCH /api/v1/auth/complete-onboarding
 * Called by the frontend after the user finishes the Onboarding flow.
 * Marks onboardingCompleted: true so the app stops redirecting to /onboarding.
 */
export const completeOnboarding = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
        req.user.id,
        { onboardingCompleted: true },
        { new: true, runValidators: false }
    );

    if (!user) {
        return next(new AppError('User not found.', 404, 'USER_NOT_FOUND'));
    }

    logger.info({ userId: user._id, orgId: user.orgId }, 'Onboarding completed');

    res.status(200).json({
        success: true,
        data: { user: user.toPublic() },
    });
});
