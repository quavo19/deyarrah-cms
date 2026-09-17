import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

const unwrap = (response) => response.data

export const deliveryService = {
  getZones: async () => unwrap(await api.get(ENDPOINTS.DELIVERY.ZONES.LIST)),
  createZone: async (deliveryZone) => unwrap(await api.post(ENDPOINTS.DELIVERY.ZONES.CREATE, { delivery_zone: deliveryZone })),
  updateZone: async (id, deliveryZone) => unwrap(await api.put(ENDPOINTS.DELIVERY.ZONES.UPDATE(id), { delivery_zone: deliveryZone })),
  deleteZone: async (id) => unwrap(await api.delete(ENDPOINTS.DELIVERY.ZONES.DELETE(id))),

  getWeightTiers: async () => unwrap(await api.get(ENDPOINTS.DELIVERY.WEIGHT_TIERS.LIST)),
  createWeightTier: async (deliveryWeightTier) => unwrap(await api.post(ENDPOINTS.DELIVERY.WEIGHT_TIERS.CREATE, { delivery_weight_tier: deliveryWeightTier })),
  updateWeightTier: async (id, deliveryWeightTier) => unwrap(await api.put(ENDPOINTS.DELIVERY.WEIGHT_TIERS.UPDATE(id), { delivery_weight_tier: deliveryWeightTier })),
  deleteWeightTier: async (id) => unwrap(await api.delete(ENDPOINTS.DELIVERY.WEIGHT_TIERS.DELETE(id))),

  getHighValueRates: async () => unwrap(await api.get(ENDPOINTS.DELIVERY.HIGH_VALUE_RATES.LIST)),
  createHighValueRate: async (deliveryHighValueRate) => unwrap(await api.post(ENDPOINTS.DELIVERY.HIGH_VALUE_RATES.CREATE, { delivery_high_value_rate: deliveryHighValueRate })),
  updateHighValueRate: async (id, deliveryHighValueRate) => unwrap(await api.put(ENDPOINTS.DELIVERY.HIGH_VALUE_RATES.UPDATE(id), { delivery_high_value_rate: deliveryHighValueRate })),
  deleteHighValueRate: async (id) => unwrap(await api.delete(ENDPOINTS.DELIVERY.HIGH_VALUE_RATES.DELETE(id))),

  getSettings: async () => unwrap(await api.get(ENDPOINTS.DELIVERY.SETTINGS)),
  updateSettings: async (deliverySetting) => unwrap(await api.put(ENDPOINTS.DELIVERY.SETTINGS, { delivery_setting: deliverySetting })),
}
