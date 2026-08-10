import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

export const warehouseService = {
  getAllWarehouses: async () => {
    const response = await api.get(ENDPOINTS.WAREHOUSES.LIST)
    return response.data
  },

  getWarehouse: async (id) => {
    const response = await api.get(ENDPOINTS.WAREHOUSES.DETAIL(id))
    return response.data
  },

  createWarehouse: async (warehouseData) => {
    const response = await api.post(ENDPOINTS.WAREHOUSES.CREATE, {
      warehouse: warehouseData
    })
    return response.data
  },

  updateWarehouse: async (id, warehouseData) => {
    const response = await api.put(ENDPOINTS.WAREHOUSES.UPDATE(id), {
      warehouse: warehouseData
    })
    return response.data
  },

  deleteWarehouse: async (id) => {
    const response = await api.delete(ENDPOINTS.WAREHOUSES.DELETE(id))
    return response.data
  },

  // Image management
  getWarehouseImages: async (warehouseId) => {
    const response = await api.get(ENDPOINTS.WAREHOUSES.IMAGES.LIST(warehouseId))
    return response.data
  },

  addWarehouseImage: async (warehouseId, imageUrl) => {
    const response = await api.post(ENDPOINTS.WAREHOUSES.IMAGES.CREATE(warehouseId), {
      image: {
        url: imageUrl
      }
    })
    return response.data
  },

  deleteWarehouseImage: async (warehouseId, imageId) => {
    const response = await api.delete(ENDPOINTS.WAREHOUSES.IMAGES.DELETE(warehouseId, imageId))
    return response.data
  },
}
