import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { inventoryService } from '@/services/inventory.service'
import CenterModal from '@/components/ui/CenterModal'
import Button from '@/components/ui/Button'
import DatePicker from '@/components/ui/DatePicker'
import Select from '@/components/ui/Select'
import { Clock } from 'lucide-react'

const StockDowntimeModal = ({ open, onClose, variantStockId }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    start_at: '',
    end_at: '',
    reason: '',
  })
  const [errors, setErrors] = useState({})

  const reasonOptions = [
    { value: '', label: 'Select a reason' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'equipment_repair', label: 'Equipment Repair' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'other', label: 'Other' },
  ]

  const createDowntimeMutation = useMutation({
    mutationFn: (data) => inventoryService.createDowntime(data),
    onSuccess: () => {
      toast.success('Downtime Scheduled', 'Downtime has been scheduled successfully')
      queryClient.invalidateQueries({ queryKey: ['variant-stocks'] })
      queryClient.invalidateQueries({ queryKey: ['downtimes'] })
      handleClose()
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to schedule downtime'
      toast.error('Scheduling Failed', errorMessage)
    },
  })

  const handleClose = () => {
    setFormData({
      start_at: '',
      end_at: '',
      reason: '',
    })
    setErrors({})
    onClose()
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.start_at) {
      newErrors.start_at = 'Start date and time is required'
    }

    if (!formData.end_at) {
      newErrors.end_at = 'End date and time is required'
    }

    if (!formData.reason) {
      newErrors.reason = 'Reason is required'
    }

    if (formData.start_at && formData.end_at) {
      const startDate = new Date(formData.start_at)
      const endDate = new Date(formData.end_at)

      if (endDate <= startDate) {
        newErrors.end_at = 'End date must be after start date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    let startAt = formData.start_at
    let endAt = formData.end_at

    if (startAt && startAt.length === 16 && !startAt.endsWith('Z')) {
      startAt = `${startAt}:00Z`
    }
    if (endAt && endAt.length === 16 && !endAt.endsWith('Z')) {
      endAt = `${endAt}:00Z`
    }

    createDowntimeMutation.mutate({
      variant_stock_id: variantStockId,
      start_at: startAt,
      end_at: endAt,
      reason: formData.reason,
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleDateChange = (field) => (e) => {
    const { value } = e.target
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  return (
    <CenterModal
      open={open}
      onClose={handleClose}
      heading="Schedule Downtime"
      description="Schedule a downtime period for this variant stock. During this time, the stock will be unavailable for orders."
      className="max-w-lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <DatePicker
          label="Start Date & Time"
          name="start_at"
          value={formData.start_at}
          onChange={handleDateChange('start_at')}
          type="datetime"
          required
          error={errors.start_at}
          containerClassName="w-full"
        />

        <DatePicker
          label="End Date & Time"
          name="end_at"
          value={formData.end_at}
          onChange={handleDateChange('end_at')}
          type="datetime"
          required
          error={errors.end_at}
          containerClassName="w-full"
        />

        <Select
          label="Reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          options={reasonOptions}
          required
          error={errors.reason}
          selectClassName="py-[10px]!"
        />

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button
            type="button"
            onClick={handleClose}
            disabled={createDowntimeMutation.isPending}
            className="flex-1 sm:flex-initial bg-gray-200! text-gray-700! border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createDowntimeMutation.isPending}
            isLoading={createDowntimeMutation.isPending}
            loadingText="Scheduling..."
            className="flex-1 sm:flex-initial flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Schedule
          </Button>
        </div>
      </div>
    </CenterModal>
  )
}

export default StockDowntimeModal
