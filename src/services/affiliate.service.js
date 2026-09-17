import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

const unwrap = (response) => response.data

export const affiliateService = {
  getApplications: async (params = {}) => unwrap(await api.get(ENDPOINTS.AFFILIATES.LIST, { params })),
  getApplication: async (id) => unwrap(await api.get(ENDPOINTS.AFFILIATES.DETAIL(id))),
  approveApplication: async (id) => unwrap(await api.post(ENDPOINTS.AFFILIATES.APPROVE(id))),
  rejectApplication: async (id, reason) => unwrap(await api.post(ENDPOINTS.AFFILIATES.REJECT(id), { reason })),
  suspendApplication: async (id, reason) => unwrap(await api.post(ENDPOINTS.AFFILIATES.SUSPEND(id), { reason })),
  reactivateApplication: async (id) => unwrap(await api.post(ENDPOINTS.AFFILIATES.REACTIVATE(id))),
}
