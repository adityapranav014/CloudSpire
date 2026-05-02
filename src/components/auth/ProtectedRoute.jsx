import { Navigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import AccessDenied from '../ui/AccessDenied'

export default function ProtectedRoute({ page, children }) {
  const { canAccessPage } = usePermissions()

  if (!canAccessPage(page)) {
    return <AccessDenied page={page} />
  }

  return children
}

