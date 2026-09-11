import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { productService } from '@/services/product.service'
import { inventoryService } from '@/services/inventory.service'
import CenterModal from '@/components/ui/CenterModal'
import Button from '@/components/ui/Button'
import DatePicker from '@/components/ui/DatePicker'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import { Clock } from 'lucide-react'
import { formatOptionNames } from './stock/stockUtils'

const DowntimeModal = ({ open, onClose, productId }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    variant_stock_ids: [],
    start_at: '',
    end_at: '',
    reason: '',
  })
  const [errors, setErrors] = useState({})

  const { data: stocksData, isLoading: isLoadingStocks } = useQuery({
    queryKey: ['variant-stocks', productId],
    queryFn: () => productService.getVariantStocks({ product_id: productId }),
    enabled: !!productId && open,
  })

  const stocks = stocksData?.data || []

  const formatStockLabel = (stock) => {
    const attrs = stock.attributes || {}
    const warehouseName = attrs.warehouse_name || 'Unknown Warehouse'
    
    let variantText = 'Unit Product'
    if (attrs.options && attrs.options.length > 0) {
      variantText = formatOptionNames(attrs.options)
    } else if (attrs.option_names && attrs.option_names.length > 0) {
      variantText = attrs.option_names.join(', ')
    }
    
    return `${variantText} - ${warehouseName}`
  }

  const reasonOptions = [
    { value: '', label: 'Select a reason' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'equipment_repair', label: 'Equipment Repair' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'other', label: 'Other' },
  ]

  const createDowntimeMutation = useMutation({
    mutationFn: async (dataArray) => {
      const results = []
      for (const data of dataArray) {
        try {
          const result = await inventoryService.createDowntime(data)
          results.push({ success: true, data: result })
        } catch (error) {
          results.push({ success: false, error })
        }
      }
      return results
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      
      if (failCount === 0) {
        toast.success('Downtime Scheduled', `Successfully scheduled downtime for ${successCount} variant stock(s)`)
      } else {
        const errorMessages = results
          .filter(r => !r.success)
          .map(r => {
            const error = r.error
            if (error?.response?.data?.error) {
              return error.response.data.error
            }
            if (error?.message) {
              return error.message
            }
            return 'Unknown error occurred'
          })
        
        const errorText = errorMessages.length > 0 
          ? errorMessages.join('; ')
          : 'Some downtimes failed to schedule'
        
        if (successCount > 0) {
          toast.error('Partial Success', `${successCount} succeeded, ${failCount} failed: ${errorText}`)
        } else {
          toast.error('Scheduling Failed', errorText)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['variant-stocks', productId] })
      handleClose()
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to schedule downtime'
      toast.error('Scheduling Failed', errorMessage)
    },
  })

  const handleClose = () => {
    setFormData({
      variant_stock_ids: [],
      start_at: '',
      end_at: '',
      reason: '',
    })
    setErrors({})
    onClose()
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.variant_stock_ids || formData.variant_stock_ids.length === 0) {
      newErrors.variant_stock_ids = 'At least one variant stock is required'
    }

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

    const downtimeDataArray = formData.variant_stock_ids.map(variant_stock_id => ({
      variant_stock_id,
      start_at: startAt,
      end_at: endAt,
      reason: formData.reason || undefined,
    }))

    createDowntimeMutation.mutate(downtimeDataArray)
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

  const handleStockToggle = (stockId) => {
    setFormData((prev) => {
      const currentIds = prev.variant_stock_ids || []
      const isSelected = currentIds.includes(stockId)
      const newIds = isSelected
        ? currentIds.filter(id => id !== stockId)
        : [...currentIds, stockId]
      
      return {
        ...prev,
        variant_stock_ids: newIds,
      }
    })
    if (errors.variant_stock_ids) {
      setErrors((prev) => ({
        ...prev,
        variant_stock_ids: undefined,
      }))
    }
  }

  const handleSelectAll = () => {
    const allStockIds = stocks.map(stock => stock.id)
    setFormData((prev) => ({
      ...prev,
      variant_stock_ids: allStockIds,
    }))
    if (errors.variant_stock_ids) {
      setErrors((prev) => ({
        ...prev,
        variant_stock_ids: undefined,
      }))
    }
  }

  const handleDeselectAll = () => {
    setFormData((prev) => ({
      ...prev,
      variant_stock_ids: [],
    }))
    if (errors.variant_stock_ids) {
      setErrors((prev) => ({
        ...prev,
        variant_stock_ids: undefined,
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

  const allSelected = stocks.length > 0 && formData.variant_stock_ids.length === stocks.length

  return (
    <CenterModal
      open={open}
      onClose={handleClose}
      heading="Schedule Downtime"
      description="Schedule a downtime period for one or more variant stocks. During this time, the selected stocks will be unavailable for orders."
      className="max-w-lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {isLoadingStocks ? (
          <div className="text-center py-4 text-gray-500">Loading variant stocks...</div>
        ) : stocks.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              No variant stocks found for this product. Please add variant stocks before scheduling downtime.
            </p>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Variant Stock <span className="text-red-500">*</span>
                </label>
                {allSelected ? (
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-xs text-primary hover:text-primary-dark underline"
                  >
                    Deselect All
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-primary hover:text-primary-dark underline"
                  >
                    Select All
                  </button>
                )}
              </div>
              <div className="border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto bg-white">
                {stocks.map((stock) => {
                  const isSelected = formData.variant_stock_ids.includes(stock.id)
                  return (
                    <label
                      key={stock.id}
                      className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleStockToggle(stock.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-primary font-medium">
                          {formatStockLabel(stock)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                           {stock.attributes?.quantity || 0} in stock
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
              {errors.variant_stock_ids && (
                <p className="mt-1 text-sm text-red-600">{errors.variant_stock_ids}</p>
              )}
            </div>

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
                Schedule {formData.variant_stock_ids.length > 0 && `(${formData.variant_stock_ids.length})`}
              </Button>
            </div>
          </>
        )}
      </div>
    </CenterModal>
  )
}

export default DowntimeModal
