import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { warehouseService } from '@/services/warehouse.service'
import BackButton from '@/components/ui/BackButton'
import WarehouseForm from '@/components/warehouses/WarehouseForm'

const NewWarehouse = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [errors, setErrors] = useState({})

  const createMutation = useMutation({
    mutationFn: warehouseService.createWarehouse,
    onSuccess: () => {
      toast.success('Warehouse Created', 'Warehouse has been created successfully. Reverse geocoding is in progress.')
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      navigate('/spaces')
    },
    onError: (error) => {
      const errorData = error.response?.data
      const errorMessage = errorData?.error || 'Failed to create warehouse'
      
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
      
      toast.error('Creation Failed', errorMessage)
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

    createMutation.mutate(formData)
  }

  const handleCancel = () => {
    navigate('/warehouses')
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
            <h1 className="text-3xl font-bold text-gray-900">Create New Warehouse</h1>
            <p className="text-gray-600 mt-2">
              Add a new warehouse location with coordinates. Reverse geocoding will populate city, region, and country automatically.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <WarehouseForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createMutation.isPending}
            errors={errors}
          />
        </div>
      </div>
    </div>
  )
}

export default NewWarehouse
