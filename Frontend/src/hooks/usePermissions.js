import { useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { selectUser, selectRolesData } from '../store/slices/authSlice';

/**
 * usePermissions — RBAC helpers driven by Redux + optional demo persona override.
 *
 * When a demo_persona is stored in localStorage (set by the Switch Role feature),
 * it overrides the real user's role for permission checks only — auth is unchanged.
 */
export function usePermissions() {
    const reduxUser = useSelector(selectUser);
    const rolesData = useSelector(selectRolesData);

    // Check for demo persona override in localStorage
    const demoPersona = useMemo(() => {
        try {
            const raw = localStorage.getItem('demo_persona');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, []);

    // Active user: demo persona overrides real user's role (not identity)
    const user = useMemo(() => {
        if (!reduxUser) return null;
        if (demoPersona) {
            // Merge: keep real user identity, override role with demo persona
            return { ...reduxUser, role: demoPersona.role, name: demoPersona.name, email: demoPersona.email };
        }
        return reduxUser;
    }, [reduxUser, demoPersona]);

    const can = useCallback((permission) => {
        if (!user || !permission) return false;
        return rolesData?.ROLE_PERMISSIONS?.[user.role]?.includes(permission) ?? false;
    }, [user, rolesData]);

    const canAccessPage = useCallback((route) => {
        if (!user) return false;
        const allowed = rolesData?.PAGE_ACCESS?.[route];
        if (!allowed) return true;
        return allowed.includes(user.role);
    }, [user, rolesData]);

    const isRole = useCallback((roleId) => user?.role === roleId, [user]);

    return { can, canAccessPage, isRole, persona: user, isDemoMode: !!demoPersona };
}
