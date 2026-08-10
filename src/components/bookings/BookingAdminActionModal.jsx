import { useState, useEffect, useRef, startTransition } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { bookingAdminService } from '@/services/booking.admin.service'
import { userService } from '@/services/user.service'
import ModalSheet from '@/components/ui/ModalSheet'
import Select from '@/components/ui/Select'
import { SearchInput } from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const BookingAdminActionModal = ({ open, onClose, booking, onSuccess }) => {
  const toast = useToast()
  const attrs = booking?.attributes || {}
  const [status, setStatus] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [staffSearch, setStaffSearch] = useState('')
  const previousBookingIdRef = useRef(null)

  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff-users', staffSearch],
    queryFn: () => userService.getAllUsers({ role: 'STAFF', search: staffSearch || undefined }),
    enabled: open,
  })

  const staffUsers = staffData?.data || []
  const staffOptions = [
    { value: '', label: 'Unassigned' },
    ...staffUsers.map((user) => ({
      value: user.id,
      label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || user.id,
    })),
  ]

  useEffect(() => {
    if (open && booking && booking.id !== previousBookingIdRef.current) {
      previousBookingIdRef.current = booking.id
      startTransition(() => {
        setStatus(attrs.status || '')
        setAssignedToId(attrs.assigned_to?.id || '')
        setStaffSearch('')
      })
    } else if (!open) {
      previousBookingIdRef.current = null
      startTransition(() => {
        setStatus('')
        setAssignedToId('')
        setStaffSearch('')
      })
    }
  }, [open, booking, attrs.status, attrs.assigned_to?.id])

  const updateMutation = useMutation({
    mutationFn: (payload) => bookingAdminService.update(booking.id, payload),
    onSuccess: () => {
      toast.success('Booking Updated', 'Booking has been updated successfully')
      onSuccess()
    },
    onError: (error) => {
      const msg = error.response?.data?.error || 'Failed to update booking'
      toast.error('Update Failed', msg)
    },
  })

  const handleSave = () => {
    const payload = {}
    if (status && status !== attrs.status) {
      payload.status = status
    }
    if (assignedToId !== (attrs.assigned_to?.id || '')) {
      payload.assigned_to_id = assignedToId || null
    }

    if (Object.keys(payload).length === 0) {
      toast.error('No Changes', 'No changes to save')
      return
    }

    updateMutation.mutate(payload)
  }

  return (
    <ModalSheet
      open={open}
      onOpenChange={onClose}
      heading="Manage Booking"
      description={`Booking #${booking?.id?.slice(0, 8) || ''} - ${attrs.product_name || ''}`}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign to Staff
          </label>
          <div className="space-y-2">
            <SearchInput
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              placeholder="Search staff by name or email..."
            />
            {isLoadingStaff ? (
              <div className="text-sm text-gray-500 py-2">Loading staff...</div>
            ) : (
              <Select
                name="assigned_to_id"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                options={staffOptions}
              />
            )}
          </div>
        </div>
      </div>
    </ModalSheet>
  )
}

export default BookingAdminActionModal
