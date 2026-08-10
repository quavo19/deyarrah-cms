import { useState, useEffect, useMemo, useRef } from 'react'
import Input from '@/components/ui/Input'
import LocationPicker from './LocationPicker'
import WarehouseImageUpload from './WarehouseImageUpload'
import { MapPin } from 'lucide-react'
import Button from '@/components/ui/Button'
import { uploadToCloudinary } from '@/utils/cloudinary'

const WarehouseForm = ({ 
  initialData = null, 
  onSubmit, 
  onCancel,
  isLoading = false,
  errors = {}
}) => {
  const initialFormData = useMemo(() => {
    if (initialData) {
      // Get first image URL from images array if available, otherwise fall back to image_url
      const images = initialData.attributes?.images || []
      const firstImageUrl = images.length > 0 ? images[0].url : ''
      const imageUrl = firstImageUrl || initialData.attributes?.image_url || ''
      
      return {
        name: initialData.attributes?.name || '',
        latitude: initialData.attributes?.latitude?.toString() || '',
        longitude: initialData.attributes?.longitude?.toString() || '',
        image_url: imageUrl,
      }
    }
    return {
      name: '',
      latitude: '',
      longitude: '',
      image_url: '',
    }
  }, [initialData])

  const [formData, setFormData] = useState(initialFormData)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const imageUploadRef = useRef(null)

  useEffect(() => {
    setFormData(initialFormData)
  }, [initialFormData])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLocationChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }))
  }

  const handleImageUploaded = (url) => {
    setFormData(prev => ({
      ...prev,
      image_url: url
    }))
  }

  const handleImageRemoved = () => {
    setFormData(prev => ({
      ...prev,
      image_url: ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
        if (imageUploadRef.current && imageUploadRef.current.hasFile() && !formData.image_url) {
      setIsUploadingImage(true)
      try {
        const file = imageUploadRef.current.getFile()
        const url = await uploadToCloudinary(file)
        setFormData(prev => ({ ...prev, image_url: url }))
        setIsUploadingImage(false)
                const submitData = {
          name: formData.name.trim(),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          image_url: url,
        }
        onSubmit(submitData)
      } catch (error) {
        setIsUploadingImage(false)
        console.error('Upload error:', error)
        const submitData = {
          name: formData.name.trim(),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        }
        onSubmit(submitData)
      }
    } else {
      const submitData = {
        name: formData.name.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      }

      if (formData.image_url !== undefined && formData.image_url !== null && formData.image_url !== '') {
        submitData.image_url = formData.image_url
      }

      onSubmit(submitData)
    }
  }

  const latitude = formData.latitude ? parseFloat(formData.latitude) : null
  const longitude = formData.longitude ? parseFloat(formData.longitude) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          label="Warehouse Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          required
          placeholder="e.g., Main Warehouse, West Coast Distribution"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location Coordinates
        </label>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            label="Latitude"
            name="latitude"
            type="number"
            step="any"
            value={formData.latitude}
            onChange={handleInputChange}
            error={errors.latitude}
            required
            placeholder="e.g., 5.6037"
            disabled={isLoading}
          />
          <Input
            label="Longitude"
            name="longitude"
            type="number"
            step="any"
            value={formData.longitude}
            onChange={handleInputChange}
            error={errors.longitude}
            required
            placeholder="e.g., -0.1870"
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4" />
          <span>Or select location on the map below</span>
        </div>
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onLocationChange={handleLocationChange}
          height="400px"
          disabled={isLoading}
        />
      </div>

      <div>
        <WarehouseImageUpload
          ref={imageUploadRef}
          imageUrl={formData.image_url}
          onImageUploaded={handleImageUploaded}
          onImageRemoved={handleImageRemoved}
          disabled={isLoading || isUploadingImage}
          autoUpload={!initialData}
        />
      </div>

      {errors.general && (
        <div className="text-red-600 text-sm">{errors.general}</div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 w-full py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <Button
          type="submit"
          disabled={isLoading || isUploadingImage}
          isLoading={isLoading || isUploadingImage}
          loadingText={isUploadingImage ? 'Uploading image...' : 'Saving...'}
          className="w-full"
        >
          {initialData ? 'Update Warehouse' : 'Create Warehouse'}
        </Button>
      </div>
    </form>
  )
}

export default WarehouseForm
