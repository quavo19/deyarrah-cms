import { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import PasswordInput from '@/components/ui/PasswordInput'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { uploadToCloudinary } from '@/utils/cloudinary'
import { validateSignupForm, validatePasswordConfirmation, validateEmail, validateName } from '@/utils'
import { User, X, ChevronRight, ChevronLeft } from 'lucide-react'

const Signup = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirmation: '',
    first_name: '',
    last_name: '',
  })
  const [errors, setErrors] = useState({})
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [signupProgress, setSignupProgress] = useState(0)

  const signupMutation = useMutation({
    mutationFn: async (userData) => {
      setSignupProgress(0)
      let avatarUrl = null
      let progressInterval = null
      
      if (avatarFile) {
        setIsUploading(true)
        setUploadProgress(0)
        setSignupProgress(5)
        
        try {
          progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              const newProgress = prev >= 90 ? 90 : prev + 10
              const overallProgress = 5 + Math.floor((newProgress / 100) * 35)
              setSignupProgress(overallProgress)
              if (prev >= 90 && progressInterval) {
                clearInterval(progressInterval)
              }
              return newProgress
            })
          }, 200)

          avatarUrl = await uploadToCloudinary(avatarFile)
          setUploadProgress(100)
          setSignupProgress(40)
          if (progressInterval) clearInterval(progressInterval)
        } catch (error) {
          if (progressInterval) clearInterval(progressInterval)
          setUploadProgress(0)
          setSignupProgress(0)
          throw new Error(error.message || 'Failed to upload avatar')
        } finally {
          setIsUploading(false)
        }
      } else {
        setSignupProgress(10)
      }

      setSignupProgress(avatarFile ? 45 : 15)
      
      const signupData = {
        user: {
          ...userData,
          avatar: avatarUrl || undefined,
        },
      }
      
      const signupProgressInterval = setInterval(() => {
        setSignupProgress((prev) => {
          if (prev >= (avatarFile ? 75 : 70)) {
            clearInterval(signupProgressInterval)
            return prev
          }
          return prev + 2
        })
      }, 100)
      
      const response = await authService.signup(signupData)
      clearInterval(signupProgressInterval)
      setSignupProgress(avatarFile ? 80 : 75)
      
      if (response.token) {
        localStorage.setItem('token', response.token)
      }
      
      return response
    },
    onSuccess: async (data) => {
      setSignupProgress(85)
      try {
        const profileProgressInterval = setInterval(() => {
          setSignupProgress((prev) => {
            if (prev >= 99) {
              clearInterval(profileProgressInterval)
              return 99
            }
            return prev + 1
          })
        }, 50)
        
        const profileResponse = await authService.getProfile()
        clearInterval(profileProgressInterval)
        setSignupProgress(100)
        queryClient.setQueryData(['auth', 'me'], profileResponse.data)
        toast.success('Signup Successful', 'Account created! Redirecting to dashboard...')
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } catch (error) {
        setSignupProgress(0)
        if (error.response?.status === 401) {
          toast.error('Authentication Error', error.response?.data?.message || 'Please login to continue')
          setTimeout(() => {
            navigate('/login')
          }, 2000)
        } else {
          if (data.token) {
            toast.warning('Profile Fetch Failed', 'Account created but could not fetch profile. Please login.')
            setTimeout(() => {
              navigate('/login')
            }, 2000)
          } else {
            toast.error('Signup Failed', error.response?.data?.message || 'An error occurred')
          }
        }
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'An error occurred during signup'
      toast.error('Signup Failed', errorMessage)
      setUploadProgress(0)
      setSignupProgress(0)
      setIsUploading(false)
    },
  })

  const validateStep1 = () => {
    const stepErrors = {}
    
    const firstNameError = validateName(formData.first_name, 'First name')
    if (firstNameError) stepErrors.first_name = firstNameError
    
    const lastNameError = validateName(formData.last_name, 'Last name')
    if (lastNameError) stepErrors.last_name = lastNameError
    
    const emailError = validateEmail(formData.email)
    if (emailError) stepErrors.email = emailError
    
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const validateStep2 = () => {
    const validation = validateSignupForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return false
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2)
      }
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
      setErrors({})
    }
  }

  const handleSubmit = () => {
    if (currentStep === 1) {
      handleNext()
      return
    }
    
    if (!validateStep2()) {
      return
    }
    
    setErrors({})
    
    signupMutation.mutate({
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      first_name: formData.first_name,
      last_name: formData.last_name,
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedFormData = {
      ...formData,
      [name]: value,
    }
    setFormData(updatedFormData)
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
    
    if ((name === 'password' || name === 'password_confirmation') && updatedFormData.password_confirmation) {
      const passwordConfirmationError = validatePasswordConfirmation(
        updatedFormData.password,
        updatedFormData.password_confirmation
      )
      if (passwordConfirmationError) {
        setErrors((prev) => ({
          ...prev,
          password_confirmation: passwordConfirmationError,
        }))
      } else if (errors.password_confirmation && updatedFormData.password === updatedFormData.password_confirmation) {
        setErrors((prev) => ({
          ...prev,
          password_confirmation: null,
        }))
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid File', 'Please select an image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File Too Large', 'Please select an image smaller than 5MB')
        return
      }

      setAvatarFile(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveFile = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    const fileInput = document.getElementById('avatar-input')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const isLoading = signupMutation.isPending || isUploading

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 montserrat py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg">
        <div className="text-center">
          <img 
            src="https://res.cloudinary.com/dqdyxf1jv/image/upload/v1768622270/pv-logo_zxretf.png" 
            alt="Logo" 
            className="h-20 mx-auto mb-4"
          />
          <h2 className="text-3xl font-bold ">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
              Login
            </Link>
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className={`h-2 w-16 rounded-full ${currentStep === 1 ? 'bg-primary' : 'bg-gray-300'}`}></div>
            <div className={`h-2 w-16 rounded-full ${currentStep === 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {currentStep === 1 && (
            <>
              <div className="flex flex-col items-center space-y-4">
                <label className="block text-sm font-medium text-center">Profile Picture</label>
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  {avatarFile && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="w-full">
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="avatar-input"
                    className={`cursor-pointer inline-block px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {avatarFile ? 'Change Picture' : 'Select Picture'}
                  </label>
                </div>
                {isUploading && (
                  <div className="w-full max-w-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Uploading...</span>
                      <span className="text-xs text-gray-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    label="First Name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="First name"
                    disabled={isLoading}
                    error={errors.first_name}
                  />
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    label="Last Name"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Last name"
                    disabled={isLoading}
                    error={errors.last_name}
                  />
                </div>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  error={errors.email}
                />
              </div>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                isLoading={isLoading}
                loadingText="Processing..."
                className="bg-primary hover:bg-primary-dark focus:ring-primary"
              >
                <span className="flex items-center justify-center">
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="space-y-4">
                <PasswordInput
                  id="password"
                  name="password"
                  label="Password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  error={errors.password}
                />

                <PasswordInput
                  id="password_confirmation"
                  name="password_confirmation"
                  label="Confirm Password"
                  required
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  error={errors.password_confirmation}
                />
              </div>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <Button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500"
                  >
                    <span className="flex items-center justify-center">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </span>
                  </Button>
                </div>
                <div className="flex-1">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    isLoading={isLoading}
                    loadingText="Creating Account..."
                    className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {isLoading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Creating your account...</span>
                <span>{signupProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${signupProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Signup
