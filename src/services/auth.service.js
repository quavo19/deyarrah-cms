import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

export const authService = {
  login: async (credentials) => {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, { user: credentials })
    return response.data
  },

  verifyOtp: async (userId, otpCode) => {
    const response = await api.post(ENDPOINTS.AUTH.OTP_VERIFY, {
      user_id: userId,
      otp_code: otpCode,
    })
    const token = response.headers?.authorization || 
                  response.headers?.Authorization || 
                  response.headers?.['x-auth-token'] ||
                  response.headers?.['X-Auth-Token']
    return {
      ...response.data,
      token: token || response.data?.token,
    }
  },

  register: async (userData) => {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, userData)
    return response.data
  },

  signup: async (userData) => {
    const response = await api.post(ENDPOINTS.AUTH.SIGNUP, userData)
    const token = response.headers?.authorization || 
                  response.headers?.Authorization || 
                  response.headers?.['x-auth-token'] ||
                  response.headers?.['X-Auth-Token']
    return {
      ...response.data,
      token: token || response.data?.token,
    }
  },

  logout: async () => {
    const response = await api.post(ENDPOINTS.AUTH.LOGOUT)
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get(ENDPOINTS.AUTH.PROFILE)
    return response.data
  },

  refreshToken: async () => {
    const response = await api.post(ENDPOINTS.AUTH.REFRESH)
    return response.data
  },

  forgotPassword: async (email) => {
    const response = await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      user: { email }
    })
    return response.data
  },

  resetPassword: async (resetData) => {
    const response = await api.put(ENDPOINTS.AUTH.RESET_PASSWORD, {
      user: resetData
    })
    return response.data
  },
}
