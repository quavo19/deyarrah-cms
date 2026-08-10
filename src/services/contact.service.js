import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

export const contactService = {
  list: async (params = {}) => {
    const response = await api.get(ENDPOINTS.CONTACTS.LIST, { params })
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(ENDPOINTS.CONTACTS.DELETE(id))
    return response.data
  },
}

