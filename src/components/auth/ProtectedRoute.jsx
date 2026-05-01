import { Navigate, useLocation } from 'react-router-dom'
import { authClient } from '../../lib/auth-client'
import { usePermissions } from '../../hooks/usePermissions'
import AccessDenied from '../ui/AccessDenied'

export default function ProtectedRoute({ page, children }) {
  const { data: session, isPending, error } = authClient.useSession()
  const { canAccessPage } = usePermissions()
  const location = useLocation()

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // If there's a session error or no session, send to login
  if (error || !session) {
    return <Navigate to="/login" state={{ from: location.pathname, error: error?.message }} replace />
  }

  if (!canAccessPage(page)) {
    return <AccessDenied page={page} />
  }

  return children
}

