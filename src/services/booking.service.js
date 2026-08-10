import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'

const normalizeBookingItem = (item, indexLabel = '') => {
  const variant_stock_id =
    item?.variant_stock_id ??
    item?.variantStockId ??
    item?.variant_stock?.id ??
    item?.variantStock?.id

  if (!variant_stock_id) {
    const suffix = indexLabel ? ` (${indexLabel})` : ''
    throw new Error(`Missing variant_stock_id for booking item${suffix}`)
  }

  return {
    variant_stock_id,
    quantity: Number(item?.quantity ?? 0),
  }
}

const normalizeBookingItems = (items, labelPrefix) => {
  if (!items) return []
  if (!Array.isArray(items)) {
    throw new Error(`${labelPrefix} must be an array`)
  }
  return items.map((item, idx) => normalizeBookingItem(item, `${labelPrefix}[${idx}]`))
}

export const bookingService = {
  /**
   * Creates a booking with booking_items and (optional) fulfillments.
   * Ensures every booking item includes variant_stock_id.
   */
  createBooking: async (booking) => {
    const payload = {
      ...booking,
      booking_items: normalizeBookingItems(booking?.booking_items, 'booking_items'),
      fulfillments: Array.isArray(booking?.fulfillments)
        ? booking.fulfillments.map((f, idx) => ({
            ...f,
            booking_items: normalizeBookingItems(f?.booking_items, `fulfillments[${idx}].booking_items`),
          }))
        : booking?.fulfillments,
    }

    const response = await api.post(ENDPOINTS.BOOKINGS.CREATE, { booking: payload })
    return response.data
  },
}

