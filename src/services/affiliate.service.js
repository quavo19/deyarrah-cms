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
  getWithdrawals: async (params = {}) => unwrap(await api.get(ENDPOINTS.AFFILIATES.WITHDRAWALS, { params })),
  approveWithdrawal: async (id) => unwrap(await api.post(ENDPOINTS.AFFILIATES.APPROVE_WITHDRAWAL(id))),
  rejectWithdrawal: async (id, reason) => unwrap(await api.post(ENDPOINTS.AFFILIATES.REJECT_WITHDRAWAL(id), { reason })),
  payWithdrawal: async (id) => unwrap(await api.post(ENDPOINTS.AFFILIATES.PAY_WITHDRAWAL(id))),
  getSettings: async () => unwrap(await api.get(ENDPOINTS.AFFILIATES.SETTINGS)),
  updateSettings: async (settings) => unwrap(await api.patch(ENDPOINTS.AFFILIATES.SETTINGS, { affiliate_settings: settings })),
}
