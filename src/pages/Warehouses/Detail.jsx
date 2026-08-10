import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { warehouseService } from '@/services/warehouse.service'
import BackButton from '@/components/ui/BackButton'
import WarehouseMap from '@/components/warehouses/WarehouseMap'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import TableSkeleton from '@/components/ui/TableSkeleton'
import WarehouseImageUpload from '@/components/warehouses/WarehouseImageUpload'
import { MapPin, Edit2, Trash2, Plus, X } from 'lucide-react'

const WarehouseDetail = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { id } = useParams()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteImageModalOpen, setDeleteImageModalOpen] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState(null)
  const [showAddImage, setShowAddImage] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)

  const {
    data: warehouseData,
    isLoading,
  } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => warehouseService.getWarehouse(id),
    enabled: !!id,
  })

  const warehouse = warehouseData?.data
  const attrs = warehouse?.attributes || {}

  const deleteMutation = useMutation({
    mutationFn: warehouseService.deleteWarehouse,
    onSuccess: () => {
      toast.success('Warehouse Deleted', 'Warehouse has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      navigate('/warehouses')
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 
                         'Failed to delete warehouse'
      toast.error('Deletion Failed', errorMessage)
    },
  })

  const handleDelete = () => {
    if (warehouse) {
      deleteMutation.mutate(warehouse.id)
    }
  }

  const images = attrs.images || []
  const hasImages = images.length > 0

  const addImageMutation = useMutation({
    mutationFn: (imageUrl) => warehouseService.addWarehouseImage(id, imageUrl),
    onSuccess: () => {
      toast.success('Image Added', 'Image has been added successfully')
      queryClient.invalidateQueries({ queryKey: ['warehouse', id] })
      setShowAddImage(false)
      setIsUploadingImage(false)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to add image'
      toast.error('Add Image Failed', errorMessage)
      setIsUploadingImage(false)
    },
  })

  const deleteImageMutation = useMutation({
    mutationFn: (imageId) => warehouseService.deleteWarehouseImage(id, imageId),
    onSuccess: () => {
      toast.success('Image Deleted', 'Image has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['warehouse', id] })
      setDeleteImageModalOpen(false)
      setSelectedImageId(null)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete image'
      toast.error('Delete Image Failed', errorMessage)
    },
  })

  const handleAddImage = async (url) => {
    setIsUploadingImage(true)
    addImageMutation.mutate(url)
  }

  const handleDeleteImageClick = (imageId) => {
    setSelectedImageId(imageId)
    setDeleteImageModalOpen(true)
  }

  const handleDeleteImageConfirm = () => {
    if (selectedImageId) {
      deleteImageMutation.mutate(selectedImageId)
    }
  }

  if (isLoading) {
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

  // Check if coordinates exist and are valid (handle both string and number)
  const lat = attrs.latitude
  const lng = attrs.longitude
  const latNum = lat != null ? (typeof lat === 'string' ? parseFloat(lat) : lat) : null
  const lngNum = lng != null ? (typeof lng === 'string' ? parseFloat(lng) : lng) : null
  
  const hasLocation = latNum != null && lngNum != null &&
                      typeof latNum === 'number' && !isNaN(latNum) && isFinite(latNum) &&
                      typeof lngNum === 'number' && !isNaN(lngNum) && isFinite(lngNum)
  
  const mapCenter = hasLocation 
    ? { lat: latNum, lng: lngNum }
    : { lat: 5.6037, lng: -0.1870 }

  return (
    <div className="bg-gray-50 min-h-screen montserrat py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton>
              Back
            </BackButton>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{attrs.name || 'Warehouse'}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Warehouse location and details
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/warehouses/${id}/edit`)}
                className="px-4 py-1 text-sm bg-gray-50 cursor-pointer text-gray-700 transition-colors border border-gray-300 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="px-4 py-1 text-sm bg-red-50 cursor-pointer text-red-500 transition-colors border border-red-300 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Images */}
          <div className="bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold">Warehouse Images</h2>
              <button
                onClick={() => setShowAddImage(!showAddImage)}
                className="px-3 py-1 text-sm bg-gray-50 cursor-pointer text-gray-700 transition-colors border border-gray-300 hover:bg-gray-100 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {showAddImage ? 'Cancel' : 'Add Image'}
              </button>
            </div>

            {/* Add Image Form */}
            {showAddImage && (
              <div className="mb-6 p-4 bg-gray-50">
                <WarehouseImageUpload
                  imageUrl=""
                  onImageUploaded={handleAddImage}
                  onImageRemoved={() => setShowAddImage(false)}
                  disabled={isUploadingImage}
                />
              </div>
            )}

            {/* Images Grid */}
            {hasImages ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div 
                      className="relative w-full h-48 bg-gray-100 overflow-hidden cursor-pointer"
                      onClick={() => setPreviewImage(image)}
                    >
                      <img
                        src={image.url}
                        alt={`${attrs.name || 'Warehouse'} image`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteImageClick(image.id)
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        title="Delete image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No images uploaded yet. Click "Add Image" to upload one.</p>
              </div>
            )}
          </div>

          {/* Map */}
          {hasLocation && (
            <div className="bg-white p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-4">Location</h2>
              <WarehouseMap
                warehouses={[warehouse]}
                center={mapCenter}
                zoom={15}
                height="400px"
              />
            </div>
          )}

          {/* Details */}
          <div className="bg-white p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{attrs.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Coordinates</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {hasLocation ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        {latNum.toFixed(6)}, {lngNum.toFixed(6)}
                      </span>
                    </div>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">City</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {attrs.city || <span className="text-gray-400">Pending geocoding...</span>}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Region</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {attrs.region || <span className="text-gray-400">Pending geocoding...</span>}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Country</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {attrs.country || <span className="text-gray-400">Pending geocoding...</span>}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {attrs.address ? (
                    <div className="space-y-2">
                      {Object.entries(attrs.address).map(([key, value]) => {
                        if (!value) return null
                        // Capitalize key: handle hyphens, underscores, and camelCase
                        const capitalizedKey = key
                          .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                          .split(/[-_\s]+/) // Split on hyphens, underscores, or spaces
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ')
                          .trim()
                        return (
                          <div key={key} className="flex gap-2">
                            <span className="font-medium text-gray-700 min-w-[120px]">
                              {capitalizedKey}:
                            </span>
                            <span className="text-gray-600">{String(value)}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-400">Pending geocoding...</span>
                  )}
                </dd>
              </div>
              
            </dl>
          </div>

          {!hasLocation && (
            <div className="bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">
                This warehouse does not have location coordinates set. Please edit the warehouse to add coordinates.
              </p>
            </div>
          )}

          {hasLocation && (!attrs.city || !attrs.region || !attrs.country) && (
            <div className="bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                Reverse geocoding is in progress. City, region, and country information will be populated automatically.
              </p>
            </div>
          )}
        </div>

        <ConfirmModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Warehouse"
          description={`Are you sure you want to delete "${attrs.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />

        <ConfirmModal
          open={deleteImageModalOpen}
          onClose={() => {
            setDeleteImageModalOpen(false)
            setSelectedImageId(null)
          }}
          onConfirm={handleDeleteImageConfirm}
          title="Delete Image"
          description="Are you sure you want to delete this image? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
          isLoading={deleteImageMutation.isPending}
        />

        {/* Image Preview Modal */}
        {previewImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div 
              className="relative max-w-7xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 bg-white text-gray-800 p-2 hover:bg-gray-100 transition-colors z-10"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={previewImage.url}
                alt={`${attrs.name || 'Warehouse'} preview`}
                className="max-w-full max-h-[90vh] object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WarehouseDetail
