import { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import PasswordInput from '@/components/ui/PasswordInput'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { validateLoginForm } from '@/utils'
import logoImage from '@/assets/images/logo.png'

const Login = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordError, setForgotPasswordError] = useState('')

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      if (data.requires_otp && data.user_id) {
        navigate('/otp', { 
          state: { userId: data.user_id },
          replace: true 
        })
      } else if (data.token) {
        localStorage.setItem('token', data.token)
        queryClient.setQueryData(['auth', 'me'], data.user)
        toast.success('Login Successful', 'Welcome back! Redirecting to dashboard...')
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1000)
      } else {
        toast.error('Login Failed', 'Invalid response from server')
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred during login'
      toast.error('Login Failed', errorMessage)
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: (data) => {
      toast.success('Email Sent', data.message || 'If your email address exists in our database, you will receive a password reset link at that email address in a few minutes.')
      setShowForgotPassword(false)
      setForgotPasswordEmail('')
      setForgotPasswordError('')
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred'
      setForgotPasswordError(errorMessage)
      toast.error('Request Failed', errorMessage)
    },
  })

  const handleSubmit = () => {
    const validation = validateLoginForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }
    
    setErrors({})
    loginMutation.mutate(formData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
  }

  const handleForgotPassword = () => {
    if (!forgotPasswordEmail) {
      setForgotPasswordError('Email is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      setForgotPasswordError('Please enter a valid email address')
      return
    }
    setForgotPasswordError('')
    forgotPasswordMutation.mutate(forgotPasswordEmail)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 montserrat">
      <div className="max-w-md w-full p-8 flex flex-col gap-6">
        <div>
          <img 
            src={logoImage} 
            alt="Logo" 
            className="h-24 mx-auto mb-6 bg-transparent"
          />
          <h2 className="text-3xl font-bold text-center ">Login</h2>
          <p className="mt-2 text-sm text-center text-gray-600">
            Admin and staff access only
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              error={errors.email}
            />
           <div className="flex flex-col gap-2 w-full">
             <PasswordInput
              id="password"
              name="password"
              label="Password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              error={errors.password}
            />
            <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-primary hover:text-primary-dark font-medium cursor-pointer"
            >
              Forgot Password?
            </button>
            </div>
          </div>
          </div>
          
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loginMutation.isPending}
            isLoading={loginMutation.isPending}
            loadingText="Logging in..."
          >
            Login
          </Button>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold mb-4 ">Forgot Password</h3>
              <p className="text-gray-600 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div className="space-y-4">
                <Input
                  id="forgot-email"
                  type="email"
                  label="Email"
                  required
                  value={forgotPasswordEmail}
                  onChange={(e) => {
                    setForgotPasswordEmail(e.target.value)
                    setForgotPasswordError('')
                  }}
                  placeholder="Enter your email"
                  error={forgotPasswordError}
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={forgotPasswordMutation.isPending}
                    isLoading={forgotPasswordMutation.isPending}
                    loadingText="Sending..."
                  >
                    Send Reset Link
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotPasswordEmail('')
                      setForgotPasswordError('')
                    }}
                    disabled={forgotPasswordMutation.isPending}
                    className="bg-gray-300! hover:bg-gray-400! focus:ring-gray-500! text-gray-800!"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
