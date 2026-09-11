import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

const normalizeOrderItem = (item, indexLabel = '') => {
  const variant_stock_id =
    item?.variant_stock_id ??
    item?.variantStockId ??
    item?.variant_stock?.id ??
    item?.variantStock?.id

  if (!variant_stock_id) {
    const suffix = indexLabel ? ` (${indexLabel})` : ''
    throw new Error(`Missing variant_stock_id for order item${suffix}`)
  }

  return {
    variant_stock_id,
    quantity: Number(item?.quantity ?? 0),
  }
}

const normalizeOrderItems = (items, labelPrefix) => {
  if (!items) return []
  if (!Array.isArray(items)) {
    throw new Error(`${labelPrefix} must be an array`)
  }
  return items.map((item, idx) => normalizeOrderItem(item, `${labelPrefix}[${idx}]`))
}

export const orderService = {
  /**
   * Creates an order with line items and optional fulfillments.
   * Keeps the legacy endpoint/key names while sending e-commerce payloads.
   */
  createOrder: async (order) => {
    const orderData = { ...(order || {}) }
    delete orderData.product_id
    delete orderData.start_at
    delete orderData.end_at
    const payload = {
      ...orderData,
      order_items: normalizeOrderItems(order?.order_items, 'order_items'),
      fulfillments: Array.isArray(order?.fulfillments)
        ? order.fulfillments.map((f, idx) => ({
            ...f,
            order_items: normalizeOrderItems(f?.order_items, `fulfillments[${idx}].order_items`),
          }))
        : order?.fulfillments,
    }

    const response = await api.post(ENDPOINTS.ORDERS.CREATE, { order: payload })
    return response.data
  },
}
