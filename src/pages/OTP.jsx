import { useState, useRef, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Button from '@/components/ui/Button'
import logoImage from '@/assets/images/logo.png'

const OTP = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const userId = location.state?.userId
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  useEffect(() => {
    if (!userId) {
      toast.error('Error', 'User ID is missing. Please login again.')
      navigate('/login', { replace: true })
    }
  }, [userId, navigate, toast])

  const otpMutation = useMutation({
    mutationFn: ({ userId, otpCode }) => authService.verifyOtp(userId, otpCode),
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('token', data.token)
        if (data.data) {
          queryClient.setQueryData(['auth', 'profile'], {
            data: data.data,
            status: data.status,
          })
          toast.success('Login Successful', 'Welcome back! Redirecting to dashboard...')
          setTimeout(() => {
            navigate('/dashboard', { replace: true })
          }, 1000)
        } else {
          queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] })
          toast.success('Login Successful', 'Welcome back! Redirecting to dashboard...')
          setTimeout(() => {
            navigate('/dashboard', { replace: true })
          }, 1000)
        }
      } else {
        toast.error('Verification Failed', 'Invalid response from server')
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Invalid OTP code'
      toast.error('Verification Failed', errorMessage)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    },
  })

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || ''
    }
    setOtp(newOtp)

    const nextEmptyIndex = newOtp.findIndex((val, idx) => !val && idx < 6)
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[5]?.focus()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      toast.warning('Validation Error', 'Please enter a complete 6-digit code')
      return
    }

    if (!userId) {
      toast.error('Error', 'User ID is missing. Please login again.')
      navigate('/login', { replace: true })
      return
    }

    otpMutation.mutate({ userId, otpCode })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 montserrat">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <img 
            src={logoImage} 
            alt="Logo" 
            className="h-24 mx-auto mb-6"
          />
          <h2 className="text-3xl font-bold text-center ">Verify OTP</h2>
          <p className="mt-2 text-sm text-center text-gray-600">
            Enter the 6-digit code sent to your email
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-14 h-14 text-center text-2xl font-semibold rounded-xl border border-gray-300 focus:border-[#F68B1F] focus:outline-none focus:ring-2 focus:ring-[#F68B1F] focus:ring-opacity-20 transition-all"
                required
                autoFocus={index === 0}
              />
            ))}
          </div>
          <Button
            type="submit"
            disabled={otpMutation.isPending}
            className="w-full"
          >
            {otpMutation.isPending ? 'Verifying...' : 'Verify'}
          </Button>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default OTP
