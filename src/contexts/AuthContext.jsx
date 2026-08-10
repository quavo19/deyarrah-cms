import { useAuth } from '@/hooks/useAuth'
import { AuthContext } from './auth-context'
import LoadingOverlay from '@/components/LoadingOverlay'

export const AuthProvider = ({ children }) => {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      <LoadingOverlay isLoading={auth.showLoading} />
      {children}
    </AuthContext.Provider>
  )
}
