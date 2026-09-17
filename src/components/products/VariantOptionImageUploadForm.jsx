import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { productService } from '@/services/product.service'
import { uploadImageToStorage } from '@/utils/storage'
import Button from '@/components/ui/Button'
import { X, Upload, Trash2 } from 'lucide-react'

const VariantOptionImageUploadForm = ({ variantId, optionId, productId, onSuccess, onCancel }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const fileInputRef = useRef(null)

  const createImageMutation = useMutation({
    mutationFn: (imageData) => productService.createVariantOptionImage(variantId, optionId, imageData),
    onSuccess: () => {
      toast.success('Image Added', 'Image has been added successfully')
      queryClient.invalidateQueries({ queryKey: ['variant-options', variantId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      handleReset()
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to add image'
      toast.error('Error', errorMessage)
    },
  })

  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'Image size must be less than 10MB')
      return
    }

    setSelectedImageFile(file)
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      toast.error('Validation Error', 'Please select an image file')
      return
    }

    setIsUploadingImage(true)
    try {
      const uploaded = await uploadImageToStorage(selectedImageFile)
      createImageMutation.mutate(uploaded)
    } catch (error) {
      toast.error('Upload Failed', error.message || 'Failed to upload image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleReset = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setSelectedImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCancel = () => {
    handleReset()
    if (onCancel) onCancel()
  }

  return (
    <div className="mt-3  border-gray-200 rounded-none">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Upload Variant Option Image</h4>

      <div className="space-y-4">
        <div
          onClick={triggerFileSelect}
          className={`
            border-2 border-dashed rounded-none p-6
            transition-colors duration-200
            cursor-pointer hover:border-gray-400 hover:bg-gray-50/40
            ${selectedImageFile ? 'border-blue-300 bg-blue-50/30' : 'border-gray-300 bg-white/50'}
            flex flex-col items-center justify-center text-center
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileSelect}
            className="hidden"
          />

          {!imagePreview ? (
            <>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Click to upload
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, WEBP • max 10MB
              </p>
            </>
          ) : (
            <div className="w-full max-w-[240px]">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-36 object-contain rounded border border-gray-200 shadow-sm"
              />
              <p className="mt-2 text-xs text-gray-600 truncate">
                {selectedImageFile.name}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2.5 md:flex-row flex-col">
          <Button
            onClick={handleUploadImage}
            disabled={!selectedImageFile || isUploadingImage || createImageMutation.isPending}
            isLoading={isUploadingImage || createImageMutation.isPending}
            loadingText="Uploading..."
            className="bg-green-600! hover:bg-green-700! text-white text-xs px-4 py-1.5 rounded-none!"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload
          </Button>

          <Button
            onClick={handleCancel}
            disabled={isUploadingImage || createImageMutation.isPending}
            variant="outline"
            className="text-xs px-4 py-1.5 bg-gray-200! text-gray-700! border-gray-300! hover:bg-gray-300! rounded-none!"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Cancel
          </Button>

          {selectedImageFile && (
            <Button
              onClick={handleReset}
              className="text-xs text-red-600! hover:text-red-900 bg-red-200! hover:bg-red-300! rounded-none!"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default VariantOptionImageUploadForm
