import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

export const supportService = {
  list: async (params = {}) => {
    const response = await api.get(ENDPOINTS.SUPPORT.LIST, { params })
    return response.data
  },

  detail: async (id) => {
    const response = await api.get(ENDPOINTS.SUPPORT.DETAIL(id))
    return response.data
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(ENDPOINTS.SUPPORT.UPDATE(id), {
      support_request: { status },
    })
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(ENDPOINTS.SUPPORT.DELETE(id))
    return response.data
  },
}
