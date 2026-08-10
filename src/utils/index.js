
export const formatRoleName = (roleName) => {
  if (!roleName) return 'Guest'
    const parts = String(roleName).split('_')
    const formatted = parts.map(part => {
    if (!part) return ''
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  }).join(' ')
  
  return formatted
}

export const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

export const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Validation functions

export const validateEmail = (email) => {
  if (!email) {
    return 'Email is required'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }
  return null
}

export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required'
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters'
  }
  return null
}

export const validatePasswordConfirmation = (password, passwordConfirmation) => {
  if (!passwordConfirmation) {
    return 'Please confirm your password'
  }
  if (password !== passwordConfirmation) {
    return 'Passwords do not match'
  }
  return null
}

export const validateRequired = (value, fieldName) => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`
  }
  return null
}

export const validateName = (name, fieldName = 'Name') => {
  if (!name || name.trim() === '') {
    return `${fieldName} is required`
  }
  if (name.trim().length < 2) {
    return `${fieldName} must be at least 2 characters`
  }
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
  }
  return null
}

// Login validation
export const validateLoginForm = (formData) => {
  const errors = {}
  
  const emailError = validateEmail(formData.email)
  if (emailError) errors.email = emailError
  
  const passwordError = validatePassword(formData.password)
  if (passwordError) errors.password = passwordError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Signup validation
export const validateSignupForm = (formData) => {
  const errors = {}
  
  const firstNameError = validateName(formData.first_name, 'First name')
  if (firstNameError) errors.first_name = firstNameError
  
  const lastNameError = validateName(formData.last_name, 'Last name')
  if (lastNameError) errors.last_name = lastNameError
  
  const emailError = validateEmail(formData.email)
  if (emailError) errors.email = emailError
  
  const passwordError = validatePassword(formData.password)
  if (passwordError) errors.password = passwordError
  
  const passwordConfirmationError = validatePasswordConfirmation(
    formData.password,
    formData.password_confirmation
  )
  if (passwordConfirmationError) errors.password_confirmation = passwordConfirmationError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
