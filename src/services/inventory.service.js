import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

export const inventoryService = {
  getAllDowntimes: async (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.variant_stock_id) queryParams.append('variant_stock_id', params.variant_stock_id)
    if (params.start_at) queryParams.append('start_at', params.start_at)
    if (params.end_at) queryParams.append('end_at', params.end_at)
    
    const queryString = queryParams.toString()
    const url = queryString 
      ? `${ENDPOINTS.INVENTORY.DOWNTIMES.LIST}?${queryString}`
      : ENDPOINTS.INVENTORY.DOWNTIMES.LIST
    
    const response = await api.get(url)
    return response.data
  },

  getDowntimeById: async (id) => {
    const response = await api.get(ENDPOINTS.INVENTORY.DOWNTIMES.DETAIL(id))
    return response.data
  },

  createDowntime: async (downtimeData) => {
    const response = await api.post(ENDPOINTS.INVENTORY.DOWNTIMES.CREATE, {
      downtime: downtimeData
    })
    return response.data
  },

  updateDowntime: async (id, downtimeData) => {
    const response = await api.patch(ENDPOINTS.INVENTORY.DOWNTIMES.UPDATE(id), {
      downtime: downtimeData
    })
    return response.data
  },

  deleteDowntime: async (id) => {
    const response = await api.delete(ENDPOINTS.INVENTORY.DOWNTIMES.DELETE(id))
    return response.data
  },

  endDowntimeEarly: async (id) => {
    const response = await api.post(ENDPOINTS.INVENTORY.DOWNTIMES.END_EARLY(id))
    return response.data
  },
}
