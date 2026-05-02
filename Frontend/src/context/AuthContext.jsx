import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    loadUser, fetchRoles, login as loginAction, registerUser as registerUserAction,
    logout as logoutAction, switchRole as switchRoleAction, setAuthLoading,
    selectIsAuthenticated, selectUser, selectRolesData, selectIsLoadingAuth,
} from '../store/slices/authSlice';
import { clearDashboard } from '../store/slices/dashboardSlice';
import { clearCosts } from '../store/slices/costsSlice';
import { clearRecommendations } from '../store/slices/recommendationsSlice';
import { clearAllMetrics } from '../store/slices/metricsSlice';

/**
 * useAuth — thin convenience hook over Redux auth state.
 *
 * Still used by: ProtectedRoute → usePermissions → can/canAccessPage
 * Will be deprecated once RBAC is moved fully to Redux selectors (Sprint 2).
 * Do NOT read `token` from this hook — it does not exist (Task 2: httpOnly cookie).
 */
export function useAuth() {
    const dispatch        = useDispatch();
    const user            = useSelector(selectUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isLoadingAuth   = useSelector(selectIsLoadingAuth);
    const rolesData       = useSelector(selectRolesData);

    const persona = user;

    const login = async (email, password) =>
        dispatch(loginAction({ email, password })).unwrap();

    const registerUserFn = async (data) =>
        dispatch(registerUserAction(data)).unwrap();

    const logout = () => {
        dispatch(logoutAction());
        // Clear all org-scoped data so next login starts clean
        dispatch(clearDashboard());
        dispatch(clearCosts());
        dispatch(clearRecommendations());
        dispatch(clearAllMetrics());
    };

    const switchRole = useCallback((roleId) => {
        console.warn('switchRole is mocked in production mode');
        dispatch(switchRoleAction(roleId));
    }, [dispatch]);

    const can = useCallback((permission) => {
        if (!user) return false;
        return rolesData?.ROLE_PERMISSIONS?.[user.role]?.includes(permission) ?? false;
    }, [user, rolesData]);

    const canAccessPage = useCallback((route) => {
        if (!user) return false;
        const allowed = rolesData?.PAGE_ACCESS?.[route];
        if (!allowed) return true;
        return allowed.includes(user.role);
    }, [user, rolesData]);

    const isRole = useCallback((roleId) => user?.role === roleId, [user]);

    return {
        persona, user, isAuthenticated, isLoadingAuth,
        login, registerUser: registerUserFn, logout, switchRole,
        can, canAccessPage, isRole,
    };
}

/**
 * AuthInitializer — runs once on app boot.
 * Calls GET /auth/me to restore session from the httpOnly cookie.
 * If the cookie is missing or expired, loadUser rejects → user stays logged out.
 * Does NOT check localStorage or Redux token (both removed in Task 2).
 */
export function AuthInitializer({ children }) {
    const dispatch    = useDispatch();
    const isLoading   = useSelector(selectIsLoadingAuth);

    useEffect(() => {
        // Always try to restore session from cookie — the server will 401 if none exists
        dispatch(fetchRoles());
        dispatch(loadUser()).catch(() => {
            // 401 is expected when not logged in — not an error
            dispatch(setAuthLoading(false));
        });
    }, [dispatch]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading session…</p>
                </div>
            </div>
        );
    }

    return children;
}
