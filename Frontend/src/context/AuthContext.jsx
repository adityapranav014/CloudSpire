import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useMigrationData } from '../hooks/useMigrationData'
import api, { extractErrorMessage } from '../services/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'cloudspire_token'

export function AuthProvider({ children }) {
  const { data: rolesData } = useMigrationData('/roles')
  const { ROLE_PERMISSIONS = {}, PAGE_ACCESS = {} } = rolesData || {}

  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEY) || null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  // persona maps mostly to user for the frontend backward compatibility
  const persona = user;

  const loadUser = useCallback(async () => {
    try {
      if (!token) return;
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
    } catch (error) {
      console.error('Failed to authenticate:', extractErrorMessage(error));
      logout()
    } finally {
      setIsLoadingAuth(false)
    }
  }, [token])

  useEffect(() => {
    if (token) loadUser();
    else setIsLoadingAuth(false);
  }, [token, loadUser])

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const newToken = res.data.token;
      localStorage.setItem(STORAGE_KEY, newToken);
      setToken(newToken);
      setUser(res.data.data.user);
    } catch (err) {
      // Re-throw with a clean user-friendly message so Login.jsx can display it
      const message = extractErrorMessage(err, 'Invalid email or password. Please try again.')
      throw new Error(message)
    }
  };

  const registerUser = async (data) => {
    try {
      const res = await api.post('/auth/register', data);
      const newToken = res.data.token;
      localStorage.setItem(STORAGE_KEY, newToken);
      setToken(newToken);
      setUser(res.data.data.user);
    } catch (err) {
      const message = extractErrorMessage(err, 'Registration failed. Please try again.')
      throw new Error(message)
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  // Preserve legacy demo role switch for testing if needed
  const switchRole = useCallback((roleId) => {
    console.warn("switchRole is mocked in Production mode");
    setUser((prev) => prev ? { ...prev, role: roleId } : null);
  }, []);

  /** Returns true if the current role has the given permission key */
  const can = useCallback((permission) => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
  }, [user, ROLE_PERMISSIONS])

  /** Returns true if the current role is allowed to navigate to `route` (e.g. '/accounts') */
  const canAccessPage = useCallback((route) => {
    if (!user) return false
    const allowed = PAGE_ACCESS[route]
    if (!allowed) return true  // unknown routes are open (public)
    return allowed.includes(user.role)
  }, [user, PAGE_ACCESS])

  /** Returns true if the current role matches the given roleId */
  const isRole = useCallback((roleId) => user?.role === roleId, [user])

  if (isLoadingAuth) {
    return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>
  }

  return (
    <AuthContext.Provider value={{ persona, user, token, login, registerUser, logout, switchRole, can, canAccessPage, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
