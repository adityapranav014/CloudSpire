import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { selectUser, selectRolesData } from '../store/slices/authSlice';

/**
 * usePermissions — RBAC helpers driven directly by Redux.
 *
 * Decoupled from AuthContext (which is being phased out — Sprint 2).
 * Safe to call in any component without requiring an AuthContext provider.
 *
 * Usage:
 *   const { can, canAccessPage, isRole } = usePermissions()
 *   can(PERMISSIONS.MANAGE_ANOMALIES)   → boolean
 *   canAccessPage('/accounts')          → boolean
 *   isRole(ROLES.TEAM_LEAD)             → boolean
 */
export function usePermissions() {
    const user      = useSelector(selectUser);
    const rolesData = useSelector(selectRolesData);

    const can = useCallback((permission) => {
        if (!user || !permission) return false;
        return rolesData?.ROLE_PERMISSIONS?.[user.role]?.includes(permission) ?? false;
    }, [user, rolesData]);

    const canAccessPage = useCallback((route) => {
        if (!user) return false;
        const allowed = rolesData?.PAGE_ACCESS?.[route];
        if (!allowed) return true; // no restriction defined → allow
        return allowed.includes(user.role);
    }, [user, rolesData]);

    const isRole = useCallback((roleId) => user?.role === roleId, [user]);

    return { can, canAccessPage, isRole, persona: user };
}
