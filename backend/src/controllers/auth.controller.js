import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Team from '../models/Team.model.js';
import Org from '../models/Org.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { createSendToken, clearAuthCookie, signToken, COOKIE_NAME } from '../services/authService.js';
import { env } from '../config/env.js';
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

    team.createdBy = user._id;
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
    console.log('[AUTH] POST /register — Request body:', { name: req.body.name, email: req.body.email, companyName: req.body.companyName });

    const { name, email, password, companyName, teamName } = req.body;

    if (!name || !email || !password) {
        console.log('[AUTH] Register error: Missing required fields');
        return next(new AppError('Name, email, and password are required.', 400, 'MISSING_FIELDS'));
    }

    if (password.length < 8) {
        console.log('[AUTH] Register error: Password too short');
        return next(new AppError('Password must be at least 8 characters.', 400, 'WEAK_PASSWORD'));
    }

    // Check email uniqueness outside the transaction — cheaper read
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
        console.log('[AUTH] Register error: Duplicate email —', email);
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
                        // createdBy set after User is created
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
                    { createdBy: newUser._id, members: [newUser._id] },
                    { session }
                ),
            ]);
        });
    } catch (err) {
        console.error('[AUTH] Register transaction error:', err.message);
        logger.error({ err }, 'Registration transaction failed');
        // Let the transaction roll back (session.withTransaction handles this)
        throw err; // Re-throw so catchAsync → errorHandler can format it
    } finally {
        session.endSession();
    }

    console.log('[AUTH] Register success — userId:', newUser._id, 'orgId:', newUser.orgId);
    logger.info({ userId: newUser._id, orgId: newUser.orgId }, 'New user registered');
    createSendToken(newUser, 201, res);
});

/**
 * POST /api/v1/auth/login
 */
export const login = catchAsync(async (req, res, next) => {
    console.log('[AUTH] POST /login — Request body:', { email: req.body.email });

    const { email, password } = req.body;

    if (!email || !password) {
        console.log('[AUTH] Login error: Missing email or password');
        return next(new AppError('Please provide email and password.', 400, 'MISSING_FIELDS'));
    }

    // password has select:false — must explicitly include it
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        // Do NOT log the email — prevents enumeration via log analysis
        console.log('[AUTH] Login error: Invalid credentials (wrong email or password)');
        return next(new AppError('Incorrect email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    if (!user.isActive) {
        console.log('[AUTH] Login error: Account inactive for userId —', user._id);
        return next(new AppError('Your account has been deactivated. Contact your admin.', 403, 'ACCOUNT_INACTIVE'));
    }

    const scopedUser = await ensureUserOrgScope(user);

    // Update lastLogin — non-blocking, don't await
    User.findByIdAndUpdate(scopedUser._id, { lastLogin: new Date() }).catch((err) =>
        logger.warn({ err, userId: user._id }, 'Failed to update lastLogin')
    );

    console.log('[AUTH] Login success — userId:', scopedUser._id, 'orgId:', scopedUser.orgId, 'role:', scopedUser.role);
    createSendToken(scopedUser, 200, res);
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's public profile.
 *
 * IMPORTANT: Do NOT populate orgId/teamId before creating JWT token.
 * The JWT must contain plain IDs, not objects. We populate ONLY for the response.
 */
export const getMe = catchAsync(async (req, res, next) => {
    console.log('[AUTH] GET /me — User:', req.user);

    // req.user is set by the protect middleware (only has _id at that point)
    // First, get the user WITHOUT populating to ensure JWT contains IDs
    let user = await User.findById(req.user.id);

    if (!user) {
        console.log('[AUTH] getMe error: User not found for id —', req.user.id);
        return next(new AppError('User account no longer exists.', 404, 'USER_NOT_FOUND'));
    }

    const scopedUser = await ensureUserOrgScope(user);

    console.log('[AUTH] getMe success — userId:', scopedUser._id, 'orgId:', scopedUser.orgId);
    
    // Create token with plain IDs
    const token = signToken(scopedUser);
    const isProduction = env.nodeEnv === 'production';

    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
        path: '/',
    });

    // Now populate for the response to include names
    const populatedUser = await User.findById(scopedUser._id)
        .populate('orgId', 'name plan')
        .populate('teamId', 'name');

    const userPublic = populatedUser.toPublic ? populatedUser.toPublic() : { _id: populatedUser._id };

    res.status(200).json({
        success: true,
        token,
        data: { user: userPublic },
    });
});

/**
 * POST /api/v1/auth/logout
 * Clears the httpOnly auth cookie server-side.
 * The browser purges the cookie immediately on receiving this response.
 */
export const logout = catchAsync(async (req, res) => {
    console.log('[AUTH] POST /logout — User:', req.user);
    clearAuthCookie(res);
    console.log('[AUTH] Logout success — cookie cleared');
    res.status(200).json({ success: true, data: null });
});


/**
 * POST /api/v1/auth/refresh
 * Re-issues a token for the currently authenticated user.
 * The protect middleware has already verified the incoming token.
 */
export const refreshToken = catchAsync(async (req, res, next) => {
    console.log('[AUTH] POST /refresh — User:', req.user);
    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) {
        console.log('[AUTH] Refresh error: User not found or inactive —', req.user.id);
        return next(new AppError('User not found or inactive.', 401, 'USER_NOT_FOUND'));
    }
    const scopedUser = await ensureUserOrgScope(user);
    console.log('[AUTH] Refresh success — userId:', scopedUser._id);
    createSendToken(scopedUser, 200, res);
});

/**
 * PATCH /api/v1/auth/complete-onboarding
 * Called by the frontend after the user finishes the Onboarding flow.
 * Marks onboardingCompleted: true so the app stops redirecting to /onboarding.
 */
export const completeOnboarding = catchAsync(async (req, res, next) => {
    console.log('[AUTH] PATCH /complete-onboarding — User:', req.user);
    const user = await User.findByIdAndUpdate(
        req.user.id,
        { onboardingCompleted: true },
        { new: true, runValidators: false }
    );

    if (!user) {
        console.log('[AUTH] completeOnboarding error: User not found —', req.user.id);
        return next(new AppError('User not found.', 404, 'USER_NOT_FOUND'));
    }

    console.log('[AUTH] completeOnboarding success — userId:', user._id);
    logger.info({ userId: user._id, orgId: user.orgId }, 'Onboarding completed');

    res.status(200).json({
        success: true,
        data: { user: user.toPublic() },
    });
});
