import { useAuth } from '../context/AuthContext'

/**
 * Thin convenience hook — exposes permission helpers from AuthContext.
 *
 * Usage:
 *   const { can, canAccessPage, isRole, persona } = usePermissions()
 *   can(PERMISSIONS.MANAGE_ANOMALIES)   → boolean
 *   canAccessPage('/accounts')          → boolean
 *   isRole(ROLES.TEAM_LEAD)             → boolean
 *   persona.name                        → 'James Kim'
 */
export function usePermissions() {
  const { can, canAccessPage, isRole, persona } = useAuth()
  return { can, canAccessPage, isRole, persona }
}
