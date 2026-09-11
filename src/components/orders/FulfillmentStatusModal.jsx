import { useState, useEffect, useRef, startTransition } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { orderAdminService } from '@/services/order.admin.service'
import ModalSheet from '@/components/ui/ModalSheet'
import Select from '@/components/ui/Select'

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const FulfillmentStatusModal = ({ open, onClose, fulfillment, orderId, onSuccess }) => {
  const toast = useToast()
  const fulfillmentAttrs = fulfillment?.attributes || {}
  const [status, setStatus] = useState('')
  const previousFulfillmentIdRef = useRef(null)

  useEffect(() => {
    if (open && fulfillment && fulfillment.id !== previousFulfillmentIdRef.current) {
      previousFulfillmentIdRef.current = fulfillment.id
      startTransition(() => {
        setStatus(fulfillmentAttrs.status || '')
      })
    } else if (!open) {
      previousFulfillmentIdRef.current = null
      startTransition(() => {
        setStatus('')
      })
    }
  }, [open, fulfillment, fulfillmentAttrs.status])

  const updateMutation = useMutation({
    mutationFn: (payload) => orderAdminService.update(orderId, payload),
    onSuccess: () => {
      toast.success('Fulfillment Updated', 'Fulfillment status has been updated successfully')
      onSuccess()
    },
    onError: (error) => {
      const msg = error.response?.data?.error || 'Failed to update fulfillment'
      toast.error('Update Failed', msg)
    },
  })

  const handleSave = () => {
    if (!status || status === fulfillmentAttrs.status) {
      toast.error('No Changes', 'No changes to save')
      return
    }

    updateMutation.mutate({
      fulfillments: [{ id: fulfillment.id, status }],
    })
  }

  const warehouse = fulfillmentAttrs.warehouse || {}
  const warehouseName = warehouse.name || fulfillmentAttrs.warehouse_name || 'Unknown'

  return (
    <ModalSheet
      open={open}
      onOpenChange={onClose}
      heading="Update Fulfillment Status"
      description={`Warehouse: ${warehouseName}`}
      side="right"
      primaryButton={{
        text: 'Save Changes',
        onClick: handleSave,
        disabled: updateMutation.isPending,
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
            onChange={(e) => {
              setStatus(e.target.value)
            }}
            options={[{ value: '', label: 'Select status...' }, ...STATUS_OPTIONS]}
          />
        </div>
      </div>
    </ModalSheet>
  )
}

export default FulfillmentStatusModal
