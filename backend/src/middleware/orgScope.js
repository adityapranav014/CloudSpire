import { AppError } from '../utils/AppError.js';

/**
 * orgScope — injects req.orgId and req.teamId from the JWT payload.
 *
 * MUST be used after protect middleware on every route that accesses
 * org-scoped data. This is the single enforcement point for multi-tenancy.
 *
 * Controllers should use req.orgId and req.teamId directly — never trust
 * user-supplied IDs from the request body/params for tenant scoping.
 *
 * Usage:
 *   router.get('/dashboard', protect, orgScope, getDashboardSummary)
 *   router.get('/alerts', protect, orgScope, getIndex)
 *
 * Why separate from protect?
 *   protect handles authentication (who are you?).
 *   orgScope handles tenancy (what data can you see?).
 *   Keeping them separate allows routes like /auth/me that need auth
 *   but are not org-scoped (they return the user object, not tenant data).
 */
export const orgScope = (req, _res, next) => {
    const orgId = req.user?.orgId;
    const teamId = req.user?.teamId;

    if (!orgId) {
        return next(
            new AppError(
                'Your account is not associated with an organisation. Please contact support.',
                403,
                'NO_ORG_SCOPE'
            )
        );
    }

    // Convenience aliases — controllers use req.orgId, req.teamId
    req.orgId = orgId;
    req.teamId = teamId;

    next();
};
