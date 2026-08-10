import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { warehouseService } from '@/services/warehouse.service'
import BackButton from '@/components/ui/BackButton'
import WarehouseForm from '@/components/warehouses/WarehouseForm'
import TableSkeleton from '@/components/ui/TableSkeleton'

const EditWarehouse = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { id } = useParams()
  const [errors, setErrors] = useState({})

  const {
    data: warehouseData,
    isLoading: isLoadingWarehouse,
  } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => warehouseService.getWarehouse(id),
    enabled: !!id,
  })

  const warehouse = warehouseData?.data

  const updateMutation = useMutation({
    mutationFn: (data) => warehouseService.updateWarehouse(id, data),
    onSuccess: () => {
      toast.success('Warehouse Updated', 'Warehouse has been updated successfully. Reverse geocoding is in progress.')
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse', id] })
      navigate('/warehouses')
    },
    onError: (error) => {
      const errorData = error.response?.data
      const errorMessage = errorData?.error || 'Failed to update warehouse'
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const fieldErrors = {}
        errorData.errors.forEach(err => {
          if (err.toLowerCase().includes('name')) {
            fieldErrors.name = err
          } else if (err.toLowerCase().includes('latitude') || err.toLowerCase().includes('location')) {
            fieldErrors.latitude = err
          } else if (err.toLowerCase().includes('longitude')) {
            fieldErrors.longitude = err
          } else {
            fieldErrors.general = err
          }
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: errorMessage })
      }
      
      toast.error('Update Failed', errorMessage)
    },
  })

  const handleSubmit = (formData) => {
    setErrors({})
    
    // Validation
    if (!formData.name || !formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }

    if (typeof formData.latitude !== 'number' || isNaN(formData.latitude)) {
      setErrors({ latitude: 'Valid latitude is required' })
      return
    }

    if (typeof formData.longitude !== 'number' || isNaN(formData.longitude)) {
      setErrors({ longitude: 'Valid longitude is required' })
      return
    }

    if (formData.latitude < -90 || formData.latitude > 90) {
      setErrors({ latitude: 'Latitude must be between -90 and 90' })
      return
    }

    if (formData.longitude < -180 || formData.longitude > 180) {
      setErrors({ longitude: 'Longitude must be between -180 and 180' })
      return
    }

    updateMutation.mutate(formData)
  }

  const handleCancel = () => {
    navigate('/warehouses')
  }

  if (isLoadingWarehouse) {
    return (
      <div className="bg-gray-50 min-h-screen montserrat py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <TableSkeleton />
        </div>
      </div>
    )
  }

  if (!warehouse) {
    return (
      <div className="bg-gray-50 min-h-screen montserrat py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Warehouse not found</p>
            <button
              onClick={() => navigate('/warehouses')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Back to Warehouses
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen montserrat py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton>
              Back
            </BackButton>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Warehouse</h1>
            <p className="text-gray-600 mt-2">
              Update warehouse location and information. Changing coordinates will trigger reverse geocoding.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <WarehouseForm
            initialData={warehouse}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updateMutation.isPending}
            errors={errors}
          />
        </div>
      </div>
    </div>
  )
}

export default EditWarehouse
