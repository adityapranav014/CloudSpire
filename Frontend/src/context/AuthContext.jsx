import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  loadUser, fetchRoles, login as loginAction, registerUser as registerUserAction, 
  logout as logoutAction, switchRole as switchRoleAction, setAuthLoading
} from '../store/slices/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const isLoadingAuth = useSelector((state) => state.auth.isLoadingAuth);
  const rolesData = useSelector((state) => state.auth.rolesData);

  const persona = user; // fallback

  const login = async (email, password) => {
    return dispatch(loginAction({ email, password })).unwrap();
  };

  const registerUser = async (data) => {
    return dispatch(registerUserAction(data)).unwrap();
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  const switchRole = useCallback((roleId) => {
    console.warn("switchRole is mocked in Production mode");
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
    persona, user, token, isLoadingAuth, 
    login, registerUser, logout, switchRole, 
    can, canAccessPage, isRole 
  };
}

export function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const isLoadingAuth = useSelector((state) => state.auth.isLoadingAuth);

  useEffect(() => {
    dispatch(fetchRoles());
    if (token) {
      dispatch(loadUser());
    } else {
      dispatch(setAuthLoading(false));
    }
  }, [dispatch, token]);

  if (isLoadingAuth) {
    return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }

  return children;
}
