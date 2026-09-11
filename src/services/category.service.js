import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

export const categoryService = {
  getAllCategories: async () => {
    const response = await api.get(ENDPOINTS.CATEGORIES.LIST)
    return response.data
  },

  getCategoryById: async (id) => {
    const response = await api.get(ENDPOINTS.CATEGORIES.DETAIL(id))
    return response.data
  },

  createCategory: async (categoryData) => {
    const response = await api.post(ENDPOINTS.CATEGORIES.CREATE, {
      category: categoryData
    })
    return response.data
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(ENDPOINTS.CATEGORIES.UPDATE(id), {
      category: categoryData
    })
    return response.data
  },

  deleteCategory: async (id) => {
    const response = await api.delete(ENDPOINTS.CATEGORIES.DELETE(id))
    return response.data
  },

  getAllSubCategories: async (params = {}) => {
    const response = await api.get(ENDPOINTS.SUB_CATEGORIES.LIST, { params })
    return response.data
  },

  createSubCategory: async (subCategoryData) => {
    const response = await api.post(ENDPOINTS.SUB_CATEGORIES.CREATE, {
      sub_category: subCategoryData
    })
    return response.data
  },

  updateSubCategory: async (id, subCategoryData) => {
    const response = await api.put(ENDPOINTS.SUB_CATEGORIES.UPDATE(id), {
      sub_category: subCategoryData
    })
    return response.data
  },

  deleteSubCategory: async (id) => {
    const response = await api.delete(ENDPOINTS.SUB_CATEGORIES.DELETE(id))
    return response.data
  },
}
