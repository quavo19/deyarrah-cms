import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

const unwrap = (response) => response.data

export const transactionService = {
  getTransactions: async (params = {}) => unwrap(await api.get(ENDPOINTS.TRANSACTIONS.LIST, { params })),
}
