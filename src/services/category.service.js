import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

export const categoryService = {
  getAllCategories: async () => {
    const response = await api.get(ENDPOINTS.CATEGORIES.LIST)
    return response.data
  },

  createCategory: async (categoryData) => {
    const response = await api.post(ENDPOINTS.CATEGORIES.CREATE, {
      category: categoryData
    })
    return response.data
  },

  deleteCategory: async (id) => {
    const response = await api.delete(ENDPOINTS.CATEGORIES.DELETE(id))
    return response.data
  },
}
