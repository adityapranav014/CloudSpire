import { usePermissions } from '../../hooks/usePermissions'
import AccessDenied from '../ui/AccessDenied'

/**
 * Wraps a page element and renders <AccessDenied /> if the current role
 * cannot access the given route.
 *
 * Usage (in App.jsx):
 *   <Route path="/accounts" element={<ProtectedRoute page="/accounts"><Accounts /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ page, children }) {
  const { canAccessPage } = usePermissions()
  if (!canAccessPage(page)) return <AccessDenied page={page} />
  return children
}
