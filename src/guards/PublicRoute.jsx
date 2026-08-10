import { Navigate } from 'react-router-dom'

const PublicRoute = ({ children }) => {
  // Check if user is authenticated
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PublicRoute
