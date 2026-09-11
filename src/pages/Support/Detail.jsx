import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, UserCircle } from 'lucide-react'
import { supportService } from '@/services/support.service'
import Image from '@/components/ui/Image'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { useToast } from '@/hooks/useToast'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'resolved', label: 'Resolved' },
]

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

const SupportDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['support-request', id],
    queryFn: () => supportService.detail(id),
    enabled: Boolean(id),
  })

  const request = data?.data
  const attrs = request?.attributes || {}
  const user = attrs.user

  const statusMutation = useMutation({
    mutationFn: (nextStatus) => supportService.updateStatus(id, nextStatus),
    onSuccess: () => {
      toast.success('Status Updated', 'Support status has been updated successfully')
      queryClient.invalidateQueries({ queryKey: ['support-request', id] })
      queryClient.invalidateQueries({ queryKey: ['support-requests'] })
    },
    onError: (mutationError) => {
      toast.error('Update Failed', mutationError.response?.data?.errors?.[0] || mutationError.response?.data?.error || 'Failed to update support status')
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <TableSkeleton />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-gray-600">Support request not found</p>
        <Button onClick={() => navigate('/support')} className="mt-4 w-auto">Back to Support</Button>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="max-w-5xl mx-auto p-2 sm:p-6">
        <button
          onClick={() => navigate('/support')}
          className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Support
        </button>

        <div className="bg-white p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Image
                src={user?.avatar}
                alt={attrs.requester_name || attrs.requester_email || 'Requester'}
                fallbackIcon={UserCircle}
                className="w-16 h-16 rounded-full object-cover"
                iconClassName="w-7 h-7"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {attrs.requester_name || 'Guest'}
                </h1>
                <p className="text-sm text-gray-500">{attrs.requester_email || 'No email'}</p>
                <p className="text-sm text-gray-500">{attrs.requester_phone || 'No phone'}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-medium text-gray-900">{attrs.topic_label || attrs.topic}</p>
              <p className="mt-1 text-xs text-gray-500">{formatDate(attrs.created_at)}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Requester Type</p>
              <p className="mt-2 text-sm text-gray-900">{user ? 'Logged in user' : 'Guest'}</p>
            </div>
            <div className="bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Support Topic</p>
              <p className="mt-2 text-sm text-gray-900">{attrs.topic_label || attrs.topic}</p>
            </div>
            <div className="bg-gray-50 p-4">
              <Select
                label="Status"
                value={attrs.status || 'pending'}
                onChange={(event) => statusMutation.mutate(event.target.value)}
                options={STATUS_OPTIONS}
                disabled={statusMutation.isPending}
                selectClassName="py-2! text-sm! rounded-lg!"
              />
            </div>
          </div>

          <div className="mt-8">
            <Textarea
              label="Description"
              value={attrs.message || ''}
              readOnly
              rows={10}
              textareaClassName="bg-gray-50"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportDetail
