import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { orderAdminService } from '@/services/order.admin.service'
import { SearchInput } from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import TableSkeleton from '@/components/ui/TableSkeleton'
import Image from '@/components/ui/Image'
import { RefreshCw, MoreVertical, Eye } from 'lucide-react'
import OrderAdminActionModal from '@/components/orders/OrderAdminActionModal'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

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

const OrdersAdmin = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()

  const initialStatus = searchParams.get('status') || ''

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(initialStatus)
  const [page, setPage] = useState(1)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const perPage = 25

  const {
    data: ordersData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['orders-admin', { search, status, page, perPage }],
    queryFn: () => {
      const params = {
        search: search || undefined,
        status: status || undefined,
        page,
        per_page: perPage,
      }
      return orderAdminService.list(params)
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    staleTime: 0,
    cacheTime: 0,
  })

  const orders = ordersData?.data || []
  const meta = ordersData?.meta || {}
  const totalPages = meta.total_pages || 1

  const handleActionClick = (order) => {
    setSelectedOrder(order)
    setActionModalOpen(true)
  }

  const handleModalClose = () => {
    setActionModalOpen(false)
    setSelectedOrder(null)
  }

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="max-w-7xl mx-auto p-2 sm:p-6">
        <div className="flex flex-col mb-6">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Orders</h1>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage all orders.
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 w-full flex-col sm:flex-row">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by order ID or customer..."
              className="w-full!"
            />
          <div className="flex gap-3 w-full! sm:w-auto!">
            <Select
              name="status"
              value={status}
              onChange={(e) => {
                const value = e.target.value
                setStatus(value)
                setPage(1)

                const nextParams = new URLSearchParams(searchParams)
                if (value) {
                  nextParams.set('status', value)
                } else {
                  nextParams.delete('status')
                }
                setSearchParams(nextParams)
              }}
              options={STATUS_OPTIONS}
              selectClassName=" py-2! text-sm! rounded-lg! min-w-40!"
              containerClassName="w-full! sm:w-auto!"
            />
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200! hover:bg-gray-300! text-gray-700!"
              auto
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Total
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Assigned To
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8">
                      <TableSkeleton />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {search || status ? 'No orders found matching your filters' : 'No orders found'}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const attrs = order.attributes || {}
                    const currentStatus = attrs.status
                    const paymentStatus = attrs.payment_status

                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="text-left hover:underline cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                Order #{attrs.order_id || order.id?.slice(0, 8) || '—'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {attrs.customer?.email || attrs.customer?.first_name || 'Customer'}
                              </span>
                            </div>
                          </button>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusVariant(currentStatus)}>
                            {currentStatus || '—'}
                          </Badge>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <Badge variant={paymentVariant(paymentStatus)}>
                            {paymentStatus === 'completed' ? 'Paid' : paymentStatus === 'pending' ? 'Unpaid' : '—'}
                          </Badge>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          {attrs.total_price != null ? `GHS ${parseFloat(attrs.total_price).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs text-gray-500 hidden lg:table-cell">
                          {attrs.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src={attrs.assigned_to.avatar}
                                alt={attrs.assigned_to.first_name || attrs.assigned_to.email || 'Staff'}
                                className="w-8 h-8 rounded-full object-cover"
                                fallbackIconSize="w-4 h-4"
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-900 w-16 truncate">
                                  {`${attrs.assigned_to.first_name || ''} ${attrs.assigned_to.last_name || ''}`.trim() ||
                                    attrs.assigned_to.email ||
                                    'Staff'}
                                </span>
                                {attrs.assigned_to.email && (
                                  <span className="text-[11px] text-gray-500 w-16 truncate">
                                    {attrs.assigned_to.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                           {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
                            <button
                              onClick={() => handleActionClick(order)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              title="Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                           )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {meta.current_page || 1} of {totalPages}
              {meta.total_count && ` (${meta.total_count} total orders)`}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 text-sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {selectedOrder && (
          <OrderAdminActionModal
            open={actionModalOpen}
            onClose={handleModalClose}
            order={selectedOrder}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['orders-admin'] })
              handleModalClose()
            }}
          />
        )}
      </div>
    </div>
  )
}

export default OrdersAdmin
