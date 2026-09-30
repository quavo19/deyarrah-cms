import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreVertical, RefreshCw, UserCircle } from 'lucide-react'
import { supportService } from '@/services/support.service'
import { SearchInput } from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import TableSkeleton from '@/components/ui/TableSkeleton'
import Image from '@/components/ui/Image'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToast } from '@/hooks/useToast'

const TOPIC_OPTIONS = [
  { value: '', label: 'All topics' },
  { value: 'order_enquiry', label: 'Order Enquiry' },
  { value: 'general_support', label: 'General Support' },
  { value: 'delivery_issue', label: 'Delivery Issue' },
  { value: 'order_mismatch', label: 'Order Mismatch or Wrong Item Received' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'product_care', label: 'Product Care Question' },
  { value: 'returns_refunds', label: 'Returns and Refunds' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'resolved', label: 'Resolved' },
]

const statusVariantClass = (status) => {
  switch (status) {
    case 'resolved':
      return 'bg-green-50 text-green-700'
    case 'confirmed':
      return 'bg-blue-50 text-blue-700'
    case 'pending':
    default:
      return 'bg-amber-50 text-amber-700'
  }
}

const formatDate = (value) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const Support = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [openActionsId, setOpenActionsId] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, request: null })
  const perPage = 25

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['support-requests', { search, topic, status, page, perPage }],
    queryFn: () => supportService.list({
      search: search || undefined,
      topic: topic || undefined,
      status: status || undefined,
      page,
      per_page: perPage,
    }),
  })

  const requests = useMemo(() => data?.data || [], [data])
  const meta = data?.meta || {}

  const deleteMutation = useMutation({
    mutationFn: supportService.delete,
    onSuccess: () => {
      toast.success('Support Deleted', 'Support request has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['support-requests'] })
      setDeleteModal({ open: false, request: null })
      setOpenActionsId(null)
    },
    onError: (error) => {
      toast.error('Deletion Failed', error.response?.data?.error || 'Failed to delete support request')
    },
  })

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="max-w-7xl mx-auto p-2 sm:p-6">
        <div className="mb-6">
          <h1 className="text-lg sm:text-xl font-semibold">Support</h1>
          <p className="text-sm sm:text-base text-gray-600">View customer and guest support questions.</p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search support..."
            className="w-full!"
          />
          <Select
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value)
              setPage(1)
            }}
            options={TOPIC_OPTIONS}
            selectClassName="py-2! text-sm! rounded-lg! min-w-52!"
            containerClassName="w-full! sm:w-auto!"
          />
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            options={STATUS_OPTIONS}
            selectClassName="py-2! text-sm! rounded-lg! min-w-40!"
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

        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4">
                      <TableSkeleton />
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No support questions found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => {
                    const attrs = request.attributes || {}
                    const user = attrs.user
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Image
                              src={user?.avatar}
                              alt={attrs.requester_name || attrs.requester_email || 'Requester'}
                              fallbackIcon={UserCircle}
                              className="w-10 h-10 rounded-full object-cover"
                              iconClassName="w-5 h-5"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900 max-w-44">
                                {attrs.requester_name || 'Guest'}
                              </p>
                              <p className="truncate text-xs text-gray-500 max-w-44">
                                {attrs.requester_email || 'No email'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {attrs.topic_label || attrs.topic || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium ${statusVariantClass(attrs.status)}`}>
                            {attrs.status_label || attrs.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                          <div className="line-clamp-2">{attrs.message_preview || attrs.message || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          {formatDate(attrs.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="relative inline-flex justify-end">
                            <button
                              onClick={() => setOpenActionsId(openActionsId === request.id ? null : request.id)}
                              className="cursor-pointer inline-flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100"
                              title="Support actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {openActionsId === request.id && (
                              <div className="absolute right-0 top-9 z-20 w-32 bg-white border border-gray-200 py-1 text-left">
                                <button
                                  onClick={() => {
                                    navigate(`/support/${request.id}`)
                                    setOpenActionsId(null)
                                  }}
                                  className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteModal({ open: true, request })
                                    setOpenActionsId(null)
                                  }}
                                  className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
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

        <Pagination
          meta={meta}
          page={page}
          onPageChange={setPage}
          isLoading={isLoading || isRefetching}
          className="mt-4"
        />

        <ConfirmModal
          open={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, request: null })}
          onConfirm={() => deleteModal.request?.id && deleteMutation.mutate(deleteModal.request.id)}
          title="Delete Support Request"
          description="Are you sure you want to delete this support request? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  )
}

export default Support
