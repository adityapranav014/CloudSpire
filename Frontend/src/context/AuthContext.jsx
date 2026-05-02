import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useMigrationData } from '../hooks/useMigrationData'

const AuthContext = createContext(null)
const STORAGE_KEY = 'cloudspire_demo_role'

export function AuthProvider({ children }) {
  const { data: rolesData, isLoading } = useMigrationData('/roles')
  const { DEMO_PERSONAS = [], ROLE_PERMISSIONS = {}, PAGE_ACCESS = {} } = rolesData || {}

  const [persona, setPersona] = useState(null)

  useEffect(() => {
    if (DEMO_PERSONAS.length > 0 && !persona) {
      const saved = localStorage.getItem(STORAGE_KEY)
      let found;
      if (saved) {
        found = DEMO_PERSONAS.find(p => p.role === saved)
      }
      setPersona(found || DEMO_PERSONAS.find(p => p.role === 'finops_manager') || DEMO_PERSONAS[0])
    }
  }, [DEMO_PERSONAS, persona])

  const switchRole = useCallback((roleId) => {
    const next = DEMO_PERSONAS.find(p => p.role === roleId)
    if (!next) return
    setPersona(next)
    localStorage.setItem(STORAGE_KEY, roleId)
  }, [DEMO_PERSONAS])

  /** Returns true if the current role has the given permission key */
  const can = useCallback((permission) => {
    if (!persona) return false
    return ROLE_PERMISSIONS[persona.role]?.includes(permission) ?? false
  }, [persona, ROLE_PERMISSIONS])

  /** Returns true if the current role is allowed to navigate to `route` (e.g. '/accounts') */
  const canAccessPage = useCallback((route) => {
    if (!persona) return false
    const allowed = PAGE_ACCESS[route]
    if (!allowed) return true  // unknown routes are open (public)
    return allowed.includes(persona.role)
  }, [persona, PAGE_ACCESS])

  /** Returns true if the current role matches the given roleId */
  const isRole = useCallback((roleId) => persona?.role === roleId, [persona])

  if (isLoading || !persona) {
    return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>
  }

  return (
    <AuthContext.Provider value={{ persona, switchRole, can, canAccessPage, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
