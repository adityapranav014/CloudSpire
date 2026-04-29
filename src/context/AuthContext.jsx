import { createContext, useContext, useState, useCallback } from 'react'
import { DEMO_PERSONAS, ROLE_PERMISSIONS, PAGE_ACCESS } from '../data/mockRoles'

const AuthContext = createContext(null)
const STORAGE_KEY = 'cloudspire_demo_role'

function getInitialPersona() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const found = DEMO_PERSONAS.find(p => p.role === saved)
    if (found) return found
  }
  return DEMO_PERSONAS.find(p => p.role === 'finops_manager')
}

export function AuthProvider({ children }) {
  const [persona, setPersona] = useState(getInitialPersona)

  const switchRole = useCallback((roleId) => {
    const next = DEMO_PERSONAS.find(p => p.role === roleId)
    if (!next) return
    setPersona(next)
    localStorage.setItem(STORAGE_KEY, roleId)
  }, [])

  /** Returns true if the current role has the given permission key */
  const can = useCallback((permission) => {
    return ROLE_PERMISSIONS[persona.role]?.includes(permission) ?? false
  }, [persona.role])

  /** Returns true if the current role is allowed to navigate to `route` (e.g. '/accounts') */
  const canAccessPage = useCallback((route) => {
    const allowed = PAGE_ACCESS[route]
    if (!allowed) return true  // unknown routes are open (public)
    return allowed.includes(persona.role)
  }, [persona.role])

  /** Returns true if the current role matches the given roleId */
  const isRole = useCallback((roleId) => persona.role === roleId, [persona.role])

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
