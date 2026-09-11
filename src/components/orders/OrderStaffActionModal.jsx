import { useState, useEffect, startTransition } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { orderAdminService } from '@/services/order.admin.service'
import ModalSheet from '@/components/ui/ModalSheet'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

// Staff can only close out assigned orders.
const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const OrderStaffActionModal = ({ open, onClose, order, onSuccess }) => {
  const toast = useToast()
  const attrs = order?.attributes || {}
  const [status, setStatus] = useState(attrs.status || '')

  useEffect(() => {
    if (open && order) {
      startTransition(() => {
        setStatus(attrs.status || '')
      })
    }
  }, [open, order, attrs.status])

  const updateMutation = useMutation({
    mutationFn: (payload) => orderAdminService.update(order.id, payload),
    onSuccess: () => {
      toast.success('Order Updated', 'Order status has been updated successfully')
      onSuccess()
    },
    onError: (error) => {
      const msg = error.response?.data?.error || 'Failed to update order'
      toast.error('Update Failed', msg)
    },
  })

  const handleSave = () => {
    if (!status || status === attrs.status) {
      toast.error('No Changes', 'Please select a different status')
      return
    }

    if (!STATUS_OPTIONS.find((opt) => opt.value === status)) {
      toast.error('Invalid Status', 'You can only update to completed or cancelled')
      return
    }

    updateMutation.mutate({ status })
  }

  return (
    <ModalSheet
      open={open}
      onOpenChange={onClose}
      heading="Update Order Status"
      description={`Order #${attrs.order_id || order?.id?.slice(0, 8) || ''}`}
      side="right"
      primaryButton={{
        text: 'Save Changes',
        onClick: handleSave,
        disabled: updateMutation.isPending || !status || status === attrs.status,
        isLoading: updateMutation.isPending,
      }}
      secondaryButton={{
        text: 'Cancel',
        onClick: onClose,
      }}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <Select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[{ value: '', label: 'Select status...' }, ...STATUS_OPTIONS]}
          />
          <p className="mt-2 text-xs text-gray-500">
            You can only update to: Completed or Cancelled
          </p>
        </div>
      </div>
    </ModalSheet>
  )
}

export default OrderStaffActionModal
