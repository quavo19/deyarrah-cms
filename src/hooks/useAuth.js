import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/useToast'
import { getUserRole } from '@/utils/roleGuard'

export const useAuth = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()
  const [showLoading, setShowLoading] = useState(false)
  const loadingStartTimeRef = useRef(null)
  const timerRef = useRef(null)

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: authService.getCurrentUser,
    retry: false,
    enabled: !!localStorage.getItem('token'),
    onError: (error) => {
      console.log(error)
      if (error.response?.data?.error === 'Unauthorized' || error.response?.status === 401) {
        localStorage.removeItem('token')
        const errorMessage = error.response?.data?.message || 'Please login to continue'
        toast.error('Unauthorized', errorMessage)
        queryClient.clear()
        navigate('/login', { replace: true })
      }
    },
  })

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (isLoading) {
      loadingStartTimeRef.current = Date.now()
      requestAnimationFrame(() => {
        setShowLoading(true)
      })
    } else {
      if (loadingStartTimeRef.current !== null) {
        const elapsed = Date.now() - loadingStartTimeRef.current
        const remainingTime = Math.max(0, 1500 - elapsed)
        
        timerRef.current = setTimeout(() => {
          setShowLoading(false)
          loadingStartTimeRef.current = null
        }, remainingTime)
      } else {
        requestAnimationFrame(() => {
          setShowLoading(false)
        })
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isLoading])

  const user = responseData?.data || null

  useEffect(() => {
    if (!isLoading && user) {
      const userRole = getUserRole(user)
      if (userRole === 'CUSTOMER') {
        // localStorage.removeItem('token')
        // queryClient.clear()
        window.location.href = 'https://platinumvault.com'
      }
    }
  }, [user, isLoading, queryClient])

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('token', data.token)
        queryClient.setQueryData(['auth', 'me'], data.user)
        const userRole = getUserRole(data.user)
        if (userRole === 'CUSTOMER') {
          window.location.href = 'https://platinumvault.com'
          return
        }
        
        navigate('/dashboard')
      }
    },
  })

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('token', data.token)
        queryClient.setQueryData(['auth', 'me'], data.user)
        const userRole = getUserRole(data.user)
        if (userRole === 'CUSTOMER') {
          window.location.href = 'https://platinumvault.com'
          return
        }
        
        navigate('/dashboard')
      }
    },
  })

  const logout = () => {
    localStorage.removeItem('token')
    queryClient.clear()
    navigate('/login', { replace: true })
    window.history.pushState(null, '', '/login')
  }

  return {
    user,
    isLoading,
    showLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  }
}
