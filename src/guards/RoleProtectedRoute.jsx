import { useAuthContext } from '@/hooks/useAuthContext'
import { getUserRole } from '@/utils/roleGuard'
import Forbidden from '@/pages/Forbidden'
import LoadingOverlay from '@/components/LoadingOverlay'

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading } = useAuthContext()
    if (isLoading) {
    return <LoadingOverlay isLoading={true} />
  }
  if (!allowedRoles || allowedRoles.length === 0) {
    return children
  }
  const userRole = getUserRole(user)
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Forbidden />
  }

  return children
}

export default RoleProtectedRoute
