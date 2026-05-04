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

    // ── HACKATHON MODE ────────────────────────────────────────────────────────
    // In a strict multi-tenant setup we'd block here with a 403. For the demo,
    // if a user has no orgId in their JWT (e.g., registered on Render without
    // running the seed script), we allow the request through with orgId=null.
    // Controllers will fall through to mock/demo data when CloudAccount queries
    // return empty results.
    // ──────────────────────────────────────────────────────────────────────────
    if (!orgId) {
        console.warn('[orgScope] No orgId on req.user — demo mode passthrough for:', req.user?.email);
    }

    // Convenience aliases — controllers use req.orgId, req.teamId
    req.orgId = orgId || null;
    req.teamId = teamId || null;

    next();
};
