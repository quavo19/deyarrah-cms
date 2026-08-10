import { api } from '@/api/client'
import { BASE_URL } from '@/constants/endpoints'

const BASE = `${BASE_URL}/customer_admin/bookings/bookings`

export const bookingAdminService = {
  list: async (params = {}) => {
    const response = await api.get(BASE, { params })
    return response.data
  },

  listAssigned: async (params = {}) => {
    const response = await api.get(`${BASE}/assigned`, { params })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`${BASE}/${id}`)
    return response.data
  },

  update: async (id, payload) => {
    const response = await api.patch(`${BASE}/${id}`, payload)
    return response.data
  },
}

