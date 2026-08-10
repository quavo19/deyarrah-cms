import { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/user.service'
import { uploadToCloudinary } from '@/utils/cloudinary'
import { validateEmail, validateName, validatePassword, validatePasswordConfirmation } from '@/utils'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import Button from '@/components/ui/Button'
import { SlideToggle } from '@/components/ui/SlideToggle'
import { User, Edit2, X } from 'lucide-react'

const Settings = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [profileFormData, setProfileFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    avatar: '',
  })
  const [passwordFormData, setPasswordFormData] = useState({
    old_password: '',
    new_password: '',
    password_confirmation: '',
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [updateProgress, setUpdateProgress] = useState(0)

  // Fetch user profile
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: userService.getProfile,
    retry: false,
  })

  // Get user data from query
  const user = profileData?.data
  
  // Use query data when not editing, form data when editing
  const displayFormData = isEditing ? profileFormData : {
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    avatar: user?.avatar || '',
  }
  const displayAvatarPreview = isEditing ? avatarPreview : (user?.avatar || null)

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (userData) => {
      setUpdateProgress(0)
      let avatarUrl = userData.avatar

      if (avatarFile) {
        try {
          setUpdateProgress(20)
          avatarUrl = await uploadToCloudinary(avatarFile)
          setUpdateProgress(50)
        } catch (error) {
          setUpdateProgress(0)
          throw new Error(error.message || 'Failed to upload avatar')
        }
      } else {
        setUpdateProgress(10)
      }

      setUpdateProgress(avatarFile ? 60 : 20)

      const updateData = {
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        avatar: avatarUrl || undefined,
      }

      const updateProgressInterval = setInterval(() => {
        setUpdateProgress((prev) => {
          if (prev >= (avatarFile ? 85 : 80)) {
            clearInterval(updateProgressInterval)
            return prev
          }
          return prev + 2
        })
      }, 100)

      const response = await userService.updateProfile(updateData)
      clearInterval(updateProgressInterval)
      setUpdateProgress(avatarFile ? 90 : 85)

      return response
    },
    onSuccess: (data) => {
      setUpdateProgress(100)
      // Update the query cache with the response data
      queryClient.setQueryData(['auth', 'profile'], data)
      
      // Update local form state with the response data
      if (data?.data) {
        const user = data.data
        setProfileFormData({
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          avatar: user.avatar || '',
        })
        // Update avatar preview if avatar exists
        if (user.avatar) {
          setAvatarPreview(user.avatar)
        } else {
          setAvatarPreview(null)
        }
      }
      
      setIsEditing(false)
      setAvatarFile(null)
      toast.success('Profile Updated', 'Your profile has been updated successfully')
      setTimeout(() => {
        setUpdateProgress(0)
      }, 1000)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to update profile'
      toast.error('Update Failed', errorMessage)
      setUpdateProgress(0)
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ oldPassword, newPassword }) => userService.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      toast.success('Password Changed', 'Your password has been changed successfully')
      setPasswordFormData({
        old_password: '',
        new_password: '',
        password_confirmation: '',
      })
      setPasswordErrors({})
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to change password'
      toast.error('Password Change Failed', errorMessage)
    },
  })

  // Toggle OTP mutation
  const toggleOtpMutation = useMutation({
    mutationFn: userService.toggleOtp,
    onSuccess: (data) => {
      const message = data.message || 'OTP setting updated successfully'
      toast.success('OTP Updated', message)
      
      // Update the cached profile data by toggling otp_enabled
      queryClient.setQueryData(['auth', 'profile'], (oldData) => {
        if (oldData?.data) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              otp_enabled: !oldData.data.otp_enabled,
            },
          }
        }
        return oldData
      })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to toggle OTP'
      toast.error('OTP Update Failed', errorMessage)
    },
  })

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileFormData({
      ...profileFormData,
      [name]: value,
    })

    if (profileErrors[name]) {
      setProfileErrors({
        ...profileErrors,
        [name]: null,
      })
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    const updatedFormData = {
      ...passwordFormData,
      [name]: value,
    }
    setPasswordFormData(updatedFormData)

    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: null,
      })
    }

    if ((name === 'new_password' || name === 'password_confirmation') && updatedFormData.password_confirmation) {
      const passwordConfirmationError = validatePasswordConfirmation(
        updatedFormData.new_password,
        updatedFormData.password_confirmation
      )
      if (passwordConfirmationError) {
        setPasswordErrors((prev) => ({
          ...prev,
          password_confirmation: passwordConfirmationError,
        }))
      } else if (passwordErrors.password_confirmation && updatedFormData.new_password === updatedFormData.password_confirmation) {
        setPasswordErrors((prev) => ({
          ...prev,
          password_confirmation: null,
        }))
      }
    }
  }

  const validateProfile = () => {
    const errors = {}

    const firstNameError = validateName(profileFormData.first_name, 'First name')
    if (firstNameError) errors.first_name = firstNameError

    const lastNameError = validateName(profileFormData.last_name, 'Last name')
    if (lastNameError) errors.last_name = lastNameError

    const emailError = validateEmail(profileFormData.email)
    if (emailError) errors.email = emailError

    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePasswordForm = () => {
    const errors = {}

    if (!passwordFormData.old_password) {
      errors.old_password = 'Old password is required'
    }

    const passwordError = validatePassword(passwordFormData.new_password)
    if (passwordError) errors.new_password = passwordError

    const passwordConfirmationError = validatePasswordConfirmation(
      passwordFormData.new_password,
      passwordFormData.password_confirmation
    )
    if (passwordConfirmationError) errors.password_confirmation = passwordConfirmationError

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProfileSubmit = () => {
    if (!validateProfile()) {
      return
    }

    updateProfileMutation.mutate(profileFormData)
  }

  const handlePasswordSubmit = () => {
    if (!validatePasswordForm()) {
      return
    }

    changePasswordMutation.mutate({
      oldPassword: passwordFormData.old_password,
      newPassword: passwordFormData.new_password,
    })
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

  const handleCancelEdit = () => {
    if (profileData?.data) {
      const user = profileData.data
      setProfileFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        avatar: user.avatar || '',
      })
      setAvatarPreview(user.avatar || null)
    }
    setAvatarFile(null)
    setProfileErrors({})
    setIsEditing(false)
  }

  const handleToggleOtp = () => {
    toggleOtpMutation.mutate()
  }

  const isLoading = updateProfileMutation.isPending
  const otpEnabled = profileData?.data?.otp_enabled || false

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 montserrat">
      <div className="max-w-4xl p-6">
        <div className="flex flex-col mb-4">
            <h1 className="text-2xl font-bold ">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences.</p>
        </div>
        <div>
          <div className="border-b border-gray-200 max-w-fit ">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'security'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Security
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8 w-full">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-light">Profile Information</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
                    >
                      <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                  <label className="block text-sm font-medium text-center">Profile Picture</label>
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                      {displayAvatarPreview ? (
                        <img
                          src={displayAvatarPreview}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    {isEditing && avatarFile && (
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
                  {isEditing && (
                    <div className="w-full flex flex-col items-center gap-2">
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
                  )}
                </div>

                {/* Profile Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      label="First Name"
                      required
                      value={displayFormData.first_name}
                      onChange={handleProfileChange}
                      placeholder="First name"
                      disabled={!isEditing || isLoading}
                      error={profileErrors.first_name}
                    />
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      label="Last Name"
                      required
                      value={displayFormData.last_name}
                      onChange={handleProfileChange}
                      placeholder="Last name"
                      disabled={!isEditing || isLoading}
                      error={profileErrors.last_name}
                    />
                  </div>

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email"
                    required
                    value={displayFormData.email}
                    onChange={handleProfileChange}
                    placeholder="Enter your email"
                    disabled={!isEditing || isLoading}
                    error={profileErrors.email}
                  />
                </div>

                {/* Progress Bar */}
                {isLoading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Updating profile...</span>
                      <span>{updateProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${updateProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={handleProfileSubmit}
                      disabled={isLoading}
                      isLoading={isLoading}
                      loadingText="Updating..."
                      className="flex-1"
                    >
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                      className="flex-1 bg-gray-200! text-gray-700! border-gray-300 hover:bg-gray-50 focus:ring-blue-500"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <h2 className="text-xl font-light">Security Settings</h2>

                {/* Change Password Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                  <div className="space-y-4">
                    <PasswordInput
                      id="old_password"
                      name="old_password"
                      label="Current Password"
                      required
                      value={passwordFormData.old_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                      disabled={changePasswordMutation.isPending}
                      error={passwordErrors.old_password}
                    />

                    <PasswordInput
                      id="new_password"
                      name="new_password"
                      label="New Password"
                      required
                      value={passwordFormData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your new password"
                      disabled={changePasswordMutation.isPending}
                      error={passwordErrors.new_password}
                    />

                    <PasswordInput
                      id="password_confirmation"
                      name="password_confirmation"
                      label="Confirm New Password"
                      required
                      value={passwordFormData.password_confirmation}
                      onChange={handlePasswordChange}
                      placeholder="Confirm your new password"
                      disabled={changePasswordMutation.isPending}
                      error={passwordErrors.password_confirmation}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handlePasswordSubmit}
                    disabled={changePasswordMutation.isPending}
                    isLoading={changePasswordMutation.isPending}
                    loadingText="Changing Password..."
                    className="w-full sm:w-auto"
                  >
                    Change Password
                  </Button>
                </div>

                {/* OTP Toggle Section */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Two-Factor Authentication (OTP)</h3>
                      <p className="text-sm text-gray-600">
                        Enable OTP to add an extra layer of security to your account. You'll be required to enter a verification code sent to your email when logging in.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <SlideToggle
                        value={otpEnabled}
                        onChange={handleToggleOtp}
                        disabled={toggleOtpMutation.isPending}
                        onLabel="Enabled"
                        offLabel="Disabled"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
