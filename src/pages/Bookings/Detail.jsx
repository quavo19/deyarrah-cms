import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { bookingAdminService } from '@/services/booking.admin.service'
import BackButton from '@/components/ui/BackButton'
import Badge from '@/components/ui/Badge'
import TableSkeleton from '@/components/ui/TableSkeleton'
import Image from '@/components/ui/Image'
import Button from '@/components/ui/Button'
import { Package, MapPin, Calendar, DollarSign, User, Truck, MoreVertical, Link } from 'lucide-react'
import FulfillmentStatusModal from '@/components/bookings/FulfillmentStatusModal'

const statusVariant = (status) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'confirmed':
    case 'dispatched':
    case 'returning':
      return 'info'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'danger'
    default:
      return 'still'
  }
}

const paymentVariant = (paymentStatus) => {
  switch (paymentStatus) {
    case 'completed':
      return 'success'
    case 'pending':
      return 'warning'
    default:
      return 'still'
  }
}

const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL || ''



const decodeVariantOptions = (variantNames) => {
  if (!variantNames || typeof variantNames !== 'string') return []

  return variantNames.split('/').map((part) => {
    const [rawKey, rawValue] = part.split(':')
    if (!rawKey || !rawValue) return null

    const key = rawKey.trim().toLowerCase()
    const value = rawValue.trim().toLowerCase()

    return { key, value }
  }).filter(Boolean)
}



const buildCustomerProductUrl = (itemAttrs, snapshot) => {
  if (!CUSTOMER_APP_URL || !itemAttrs?.product_id) return null

  const baseUrl = CUSTOMER_APP_URL.replace(/\/$/, '')
  const productPath = `/products/${itemAttrs.product_id}`

  const warehouseId = snapshot?.warehouse_id || itemAttrs?.warehouse_id
  const query = warehouseId ? `?warehouse=${encodeURIComponent(warehouseId)}` : ''

  const options = decodeVariantOptions(snapshot?.variant_stock_option_names)
  const hash =
    options.length > 0
      ? '#' +
        options
          .map(({ key, value }) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&')
      : ''

  return `${baseUrl}${productPath}${query}${hash}`
}

const BookingDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  // Determine if we're on the staff route or admin route
  const isStaffRoute = location.pathname.startsWith('/my-bookings')
  const backPath = isStaffRoute ? '/my-bookings' : '/bookings'
  const queryKey = isStaffRoute ? ['booking-detail-staff', id] : ['booking-detail', id]

  const { data: bookingData, isLoading } = useQuery({
    queryKey,
    queryFn: () => bookingAdminService.getById(id),
    enabled: !!id,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    staleTime: 0,
    cacheTime: 0,
  })


  const booking = bookingData?.data
  const attrs = booking?.attributes || {}
  const relationships = booking?.relationships || {}
  const customerAddress = relationships?.customer_address
  const bookingItems = relationships?.booking_items?.data || []
  const fulfillments = relationships?.fulfillments?.data || []

  const formatDate = (value) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const [fulfillmentModalOpen, setFulfillmentModalOpen] = useState(false)
  const [selectedFulfillment, setSelectedFulfillment] = useState(null)

  const handleFulfillmentActionClick = (fulfillment) => {
    setSelectedFulfillment(fulfillment)
    setFulfillmentModalOpen(true)
  }

  const handleFulfillmentModalClose = () => {
    setFulfillmentModalOpen(false)
    setSelectedFulfillment(null)
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen montserrat py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TableSkeleton />
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="bg-gray-50 min-h-screen montserrat py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Booking not found</p>
            <button
              onClick={() => navigate(backPath)}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Back to {isStaffRoute ? 'My Bookings' : 'Bookings'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen montserrat py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton>Back</BackButton>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Booking #{booking.id?.slice(0, 8)}
              </h1>
              
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(attrs.status)}>
                {attrs.status || '—'}
              </Badge>
              <Badge variant={paymentVariant(attrs.payment_status)}>
                {attrs.payment_status === 'completed'
                  ? 'Paid'
                  : attrs.payment_status === 'pending'
                    ? 'Unpaid'
                    : '—'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Booking Information</h2>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                  <Package className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <dt className="text-sm font-light text-gray-500 mb-1">Product</dt>
                  <dd className="text-sm text-gray-900 font-light">{attrs.product_name || '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <dt className="text-sm font-light text-gray-500 mb-1">Start Date</dt>
                  <dd className="text-sm text-gray-900 font-light">{formatDate(attrs.start_at)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <dt className="text-sm font-light text-gray-500 mb-1">End Date</dt>
                  <dd className="text-sm text-gray-900 font-light">{formatDate(attrs.end_at)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <dt className="text-sm font-light text-gray-500 mb-1">Total Price</dt>
                  <dd className="text-sm text-gray-900 font-light">
                    {attrs.total_price != null ? `GHS ${parseFloat(attrs.total_price).toFixed(2)}` : '—'}
                  </dd>
                </div>
              </div>
              {attrs.delivery_fee != null && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                    <Truck className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <dt className="text-sm font-light text-gray-500 mb-1">Delivery Fee</dt>
                    <dd className="text-sm text-gray-900 font-light">
                      GHS {parseFloat(attrs.delivery_fee).toFixed(2)}
                    </dd>
                    <p className="text-xs text-gray-500 mt-1 italic">
                      {attrs.delivery_distance} km away
                    </p>
                  </div>
                </div>
              )}
              {!isStaffRoute && attrs.assigned_to && (
                <div className="flex items-start gap-3">
                  
                  <div className="flex-1 flex items-center gap-3">
                    <Image
                      src={attrs.assigned_to.avatar}
                      alt={attrs.assigned_to.first_name || attrs.assigned_to.email || 'Staff'}
                      className="w-9 h-9 rounded-full object-cover"
                      fallbackIconSize="w-4 h-4"
                    />
                    <div>
                      <dt className="text-sm font-light text-gray-500 mb-1">Assigned To</dt>
                      <dd className="text-sm text-gray-900 font-light">
                        {`${attrs.assigned_to.first_name || ''} ${attrs.assigned_to.last_name || ''}`.trim() ||
                          attrs.assigned_to.email ||
                          'Staff'}
                      </dd>
                      {attrs.assigned_to.email && (
                        <p className="text-xs text-gray-500">{attrs.assigned_to.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {Array.isArray(attrs.phones) && attrs.phones.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <dt className="text-sm font-light text-gray-500 mb-1">Phones</dt>
                    <dd className="text-sm text-gray-900 font-light space-y-1">
                      {attrs.phones.map((phone) => (
                        <div key={phone}>{phone}</div>
                      ))}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </div>


          {customerAddress && (
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Customer Address</h2>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customerAddress.attributes?.name && (
                  <div>
                    <dt className="text-sm font-light text-gray-500 mb-1">Name</dt>
                    <dd className="text-sm text-gray-900 font-light">{customerAddress.attributes.name}</dd>
                  </div>
                )}
                {customerAddress.attributes?.city && (
                  <div>
                    <dt className="text-sm font-light text-gray-500 mb-1">City</dt>
                    <dd className="text-sm text-gray-900 font-light">{customerAddress.attributes.city}</dd>
                  </div>
                )}
                {customerAddress.attributes?.region && (
                  <div>
                    <dt className="text-sm font-light text-gray-500 mb-1">Region</dt>
                    <dd className="text-sm text-gray-900 font-light">{customerAddress.attributes.region}</dd>
                  </div>
                )}
                {customerAddress.attributes?.country && (
                  <div>
                    <dt className="text-sm font-light text-gray-500 mb-1">Country</dt>
                    <dd className="text-sm text-gray-900 font-light">{customerAddress.attributes.country}</dd>
                  </div>
                )}
                {(customerAddress.attributes?.latitude != null ||
                  customerAddress.attributes?.longitude != null) && (
                  <div className="md:col-span-2 space-y-2">
                    <div>
                      <dt className="text-sm font-light text-gray-500 mb-1">Coordinates</dt>
                      <dd className="text-sm text-gray-900 font-light">
                        {customerAddress.attributes.latitude},{' '}
                        {customerAddress.attributes.longitude}
                      </dd>
                    </div>
                    <div className="w-full h-64 overflow-hidden">
                      <iframe
                        title="Customer location"
                        src={`https://www.google.com/maps?q=${customerAddress.attributes.latitude},${customerAddress.attributes.longitude}&z=15&output=embed`}
                        className="w-full h-full border-0 rounded-none"
                        style={{ border: '0', borderRadius: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}
              </dl>
            </div>
          )}

          {bookingItems.length > 0 && (
            <div className="">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Booking Items</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookingItems.map((item) => {
                  const itemAttrs = item.attributes || {}
                  const snapshot = itemAttrs.snapshot || {}
                  const imageUrl = itemAttrs.image?.url
                  const variantOptions = decodeVariantOptions(snapshot.variant_stock_option_names)
                  const customerUrl = buildCustomerProductUrl(itemAttrs, snapshot)
               

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-xl p-1 flex gap-3 text-sm bg-white"
                    >
                      {imageUrl && (
                        <div className="w-20 h-full shrink-0 overflow-hidden rounded-xl bg-gray-50">
                          <img
                            src={imageUrl}
                            alt={snapshot.variant_stock_option_names || 'Product image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs font-medium text-gray-900 line-clamp-2">
                            {attrs.product_name || snapshot.variant_stock_option_names || 'Product'}
                          </div>
                          {variantOptions.length > 0 && (
                            <div className="text-[11px] text-gray-500 flex gap-1 flex-wrap">
                              {variantOptions.map(({ key, value }) => (
                                <div key={key}>{`${value}`}</div>
                              ))}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 ">
                            Qty: <span className="font-medium text-gray-900">{itemAttrs.quantity || '—'}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Price:{' '}
                            <span className="font-medium text-gray-900">
                              {itemAttrs.price != null
                                ? `GHS ${parseFloat(itemAttrs.price).toFixed(2)}`
                                : '—'}
                            </span>
                          </div>
                          {snapshot.warehouse_name && (
                            <div className="text-[11px] text-gray-500">
                              Warehouse: <span className="font-medium text-gray-900">{snapshot.warehouse_name}</span>
                            </div>
                          )}
                        </div>
                        {customerUrl && (
                          <div className="mt-2 flex items-center gap-1">
                            <a
                              href={customerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-[11px] font-medium text-blue-600 hover:text-blue-800"
                            >
                              View in customer app
                              <Link 
                              className="w-3 h-3 text-blue-600 hover:text-blue-800 ml-1"
                            />
                            </a>
                            
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}


          {/* Fulfillments */}
          {fulfillments.length > 0 && (
            <div className="">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Fulfillments</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Warehouse
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Delivery Date
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Fee
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fulfillments.map((fulfillment) => {
                      const fulfillmentAttrs = fulfillment.attributes || {}
                      const warehouse = fulfillmentAttrs.warehouse || {}
              

                      return (
                        <tr key={fulfillment.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {warehouse.name || fulfillmentAttrs.warehouse_name || '—'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <Badge variant={statusVariant(fulfillmentAttrs.status)}>
                              {fulfillmentAttrs.status || '—'}
                            </Badge>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                            {fulfillmentAttrs.delivery_date ? formatDate(fulfillmentAttrs.delivery_date) : '—'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {fulfillmentAttrs.delivery_fee != null
                              ? `GHS ${parseFloat(fulfillmentAttrs.delivery_fee).toFixed(2)}`
                              : '—'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                           {fulfillmentAttrs.status !== 'completed' && fulfillmentAttrs.status !== 'cancelled' && <button
                              onClick={() => handleFulfillmentActionClick(fulfillment)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              title="Update Status"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedFulfillment && (
            <FulfillmentStatusModal
              open={fulfillmentModalOpen}
              onClose={handleFulfillmentModalClose}
              fulfillment={selectedFulfillment}
              bookingId={id}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey })
                queryClient.invalidateQueries({ queryKey: ['booking-detail', id] })
                queryClient.invalidateQueries({ queryKey: ['booking-detail-staff', id] })
                handleFulfillmentModalClose()
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingDetail
