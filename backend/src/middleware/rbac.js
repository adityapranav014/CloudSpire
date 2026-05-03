/**
 * rbac.js — Role-Based Access Control middleware
 *
 * Usage:
 *   import { authorize } from '../middleware/rbac.js';
 *   router.post('/teams', protect, authorize('super_admin', 'finops_manager'), handler)
 *
 * Role hierarchy (most → least privileged):
 *   super_admin > finops_manager > cloud_engineer > team_lead > finance_analyst > read_only
 *
 * Spec alias map (CloudAspire ↔ CloudSpire role names):
 *   'admin'     → super_admin
 *   'manager'   → finops_manager
 *   'developer' → cloud_engineer
 *   'viewer'    → read_only
 *
 * ALWAYS place after the protect middleware — req.user must already be set.
 */

import { AppError } from '../utils/AppError.js';

/**
 * authorize(...roles) — RBAC gate factory.
 *
 * @param {...string} roles — one or more allowed role strings
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.post('/teams', protect, authorize('super_admin', 'finops_manager'), createTeam)
 *   router.get('/devops/status', protect, authorize('super_admin'), getDevOpsStatus)
 */
export const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            // This should never happen if protect runs first, but guard defensively
            return next(
                new AppError('Authentication required before role check.', 401, 'NO_TOKEN')
            );
        }

        const userRole = req.user.role;

        if (!roles.includes(userRole)) {
            console.log(
                `[RBAC] FORBIDDEN — userId: ${req.user.id}, role: ${userRole},` +
                ` required one of: [${roles.join(', ')}], path: ${req.originalUrl}`
            );
            return next(
                new AppError(
                    `Access denied. This action requires one of these roles: ${roles.join(', ')}.`,
                    403,
                    'FORBIDDEN'
                )
            );
        }

        next();
    };
};

// ── Convenience role sets (avoids typos across route files) ──────────────────

/** All roles that can write/mutate org-level resources */
export const WRITE_ROLES = ['super_admin', 'finops_manager'];

/** Only the organisation super admin */
export const ADMIN_ONLY = ['super_admin'];

/** All authenticated roles — use protect middleware instead for simple checks */
export const ALL_ROLES = [
    'super_admin',
    'finops_manager',
    'cloud_engineer',
    'team_lead',
    'finance_analyst',
    'read_only',
];

/**
 * Role alias map — translates CloudAspire spec role names to the internal model values.
 *
 * CloudAspire spec  →  CloudSpire model
 * ─────────────────────────────────────
 * admin             →  super_admin
 * manager           →  finops_manager
 * developer         →  cloud_engineer
 * viewer            →  read_only
 */
export const ROLE_ALIASES = {
    admin:     'super_admin',
    manager:   'finops_manager',
    developer: 'cloud_engineer',
    viewer:    'read_only',
};
