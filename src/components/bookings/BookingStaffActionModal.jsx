import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { bookingAdminService } from '@/services/booking.admin.service'
import ModalSheet from '@/components/ui/ModalSheet'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

// Booking status can now only be updated to cancelled or completed
const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const BookingStaffActionModal = ({ open, onClose, booking, onSuccess }) => {
  const toast = useToast()
  const attrs = booking?.attributes || {}
  const [status, setStatus] = useState(attrs.status || '')

  useEffect(() => {
    if (open && booking) {
      setStatus(attrs.status || '')
    }
  }, [open, booking, attrs.status])

  const updateMutation = useMutation({
    mutationFn: (payload) => bookingAdminService.update(booking.id, payload),
    onSuccess: () => {
      toast.success('Booking Updated', 'Booking status has been updated successfully')
      onSuccess()
    },
    onError: (error) => {
      const msg = error.response?.data?.error || 'Failed to update booking'
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
      heading="Update Booking Status"
      description={`Booking #${booking?.id?.slice(0, 8) || ''} - ${attrs.product_name || ''}`}
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

export default BookingStaffActionModal
