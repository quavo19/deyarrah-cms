import { api } from '@/api/client'
import apiClient from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

export const userService = {
  getProfile: async () => {
    const response = await api.get(ENDPOINTS.USERS.PROFILE)
    return response.data
  },

  updateProfile: async (userData) => {
    const response = await api.put(ENDPOINTS.USERS.PROFILE, {
      user: userData,
    })
    return response.data
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await api.put(ENDPOINTS.USERS.PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
    })
    return response.data
  },

  toggleOtp: async () => {
    const response = await api.post(ENDPOINTS.USERS.OTP_TOGGLE)
    return response.data
  },

  // User Management
  getAllUsers: async (params = {}) => {
    const response = await api.get(ENDPOINTS.USERS.LIST, { params })
    return response.data
  },

  getUserById: async (id) => {
    const response = await api.get(ENDPOINTS.USERS.DETAIL(id))
    return response.data
  },

  assignRole: async (userId, roleId) => {
    const response = await api.post(ENDPOINTS.USERS.ASSIGN_ROLE(userId, roleId))
    return response.data
  },

  assignPermissions: async (userId, permissionIds) => {
    const response = await api.post(ENDPOINTS.USERS.ASSIGN_PERMISSIONS(userId), {
      permission_ids: permissionIds,
    })
    return response.data
  },

  unassignPermissions: async (userId, permissionIds) => {
    const response = await apiClient.delete(ENDPOINTS.USERS.UNASSIGN_PERMISSIONS(userId), {
      data: { permission_ids: permissionIds },
    })
    return response.data
  },

  blockUser: async (id) => {
    const response = await api.post(ENDPOINTS.USERS.BLOCK(id))
    return response.data
  },

  unblockUser: async (id) => {
    const response = await api.post(ENDPOINTS.USERS.UNBLOCK(id))
    return response.data
  },

  // Role Management
  getAllRoles: async () => {
    const response = await api.get(ENDPOINTS.ROLES.LIST)
    return response.data
  },

  updateRole: async (id, description) => {
    const response = await api.put(ENDPOINTS.ROLES.UPDATE(id), {
      role: { description },
    })
    return response.data
  },

  // Permission Management
  getAllPermissions: async () => {
    const response = await api.get(ENDPOINTS.PERMISSIONS.LIST)
    return response.data
  },
}
