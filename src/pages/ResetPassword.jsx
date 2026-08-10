import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'
import PasswordInput from '@/components/ui/PasswordInput'
import Button from '@/components/ui/Button'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

const ResetPassword = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!token) {
      toast.error('Invalid Link', 'Password reset token is missing. Please request a new password reset link.')
      navigate('/login', { replace: true })
    }
  }, [token, navigate, toast])

  const resetPasswordMutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: (data) => {
      toast.success('Password Reset Successful', data.message || 'Your password has been changed successfully. You can now sign in.')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred while resetting your password'
      toast.error('Reset Failed', errorMessage)
      if (error.response?.data?.error === 'Reset password token is invalid') {
        setErrors({ token: 'This reset link is invalid or has expired. Please request a new one.' })
      }
    },
  })

  const handleSubmit = () => {
    // Clear previous errors
    setErrors({})

    // Validation
    if (!formData.password) {
      setErrors({ password: 'Password is required' })
      return
    }

    if (formData.password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters long' })
      return
    }

    if (!formData.password_confirmation) {
      setErrors({ password_confirmation: 'Password confirmation is required' })
      return
    }

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match' })
      return
    }

    if (!token) {
      toast.error('Invalid Link', 'Password reset token is missing.')
      return
    }

    // Submit reset password request
    resetPasswordMutation.mutate({
      reset_password_token: token,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
  }

  if (!token) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 montserrat">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <img 
            src="https://res.cloudinary.com/dqdyxf1jv/image/upload/v1768622270/pv-logo_zxretf.png" 
            alt="Logo" 
            className="h-24 mx-auto mb-6"
          />
          <h2 className="text-3xl font-bold text-center ">Reset Password</h2>
          <p className="mt-2 text-sm text-center text-gray-600">
            Enter your new password below
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {errors.token && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{errors.token}</p>
            </div>
          )}
          <div className="space-y-4">
            <PasswordInput
              id="password"
              name="password"
              label="New Password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your new password"
              error={errors.password}
            />
            <PasswordInput
              id="password_confirmation"
              name="password_confirmation"
              label="Confirm New Password"
              required
              value={formData.password_confirmation}
              onChange={handleChange}
              placeholder="Confirm your new password"
              error={errors.password_confirmation}
            />
          </div>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={resetPasswordMutation.isPending}
            isLoading={resetPasswordMutation.isPending}
            loadingText="Resetting Password..."
            className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          >
            Reset Password
          </Button>
          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
