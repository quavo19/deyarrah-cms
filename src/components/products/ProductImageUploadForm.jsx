import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { productService } from '@/services/product.service'
import { uploadImageToStorage } from '@/utils/storage'
import Button from '@/components/ui/Button'
import { Plus, X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'

const ProductImageUploadForm = ({ productId, onSuccess, onCancel }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  
  const fileInputRef = useRef(null)

  const createImageMutation = useMutation({
    mutationFn: (imageData) => productService.createProductImage(productId, imageData),
    onSuccess: () => {
      toast.success('Image Added', 'Image has been added successfully')
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
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-green-600" />
        Upload New Image
      </h3>

      <div className="space-y-5">
        <div
          onClick={triggerFileSelect}
          className={`
            border-2 border-dashed rounded-xl p-8
            transition-colors duration-200 ease-in-out
            cursor-pointer hover:border-primary/70 hover:bg-primary/5
            ${selectedImageFile ? 'border-primary/40 bg-primary/5' : 'border-gray-300'}
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
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-gray-500" />
              </div>
              <p className="text-base font-medium text-gray-700 mb-1">
                Click to upload or drag & drop
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, WEBP • Max 10MB
              </p>
            </>
          ) : (
            <div className="w-full max-w-xs">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-40 object-contain rounded-lg border border-gray-200 shadow-sm"
              />
              <p className="mt-3 text-sm text-gray-600 truncate max-w-full">
                {selectedImageFile.name}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2 md:flex-row flex-col">
          <Button
            onClick={handleUploadImage}
            disabled={!selectedImageFile || isUploadingImage || createImageMutation.isPending}
            isLoading={isUploadingImage || createImageMutation.isPending}
            loadingText="Uploading..."
            className="bg-green-600! hover:bg-green-700! text-white! text-sm! px-5! py-2! rounded-none!"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Upload Image
          </Button>

          <Button
            onClick={handleCancel}
            disabled={isUploadingImage || createImageMutation.isPending}
            variant="outline"
            className="text-sm px-5 py-2 bg-gray-200! text-gray-700! border-gray-300! hover:bg-gray-300! rounded-none!"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>

          {selectedImageFile && (
            <Button
              onClick={handleReset}
              variant="ghost"
              className="text-sm text-red-600! hover:text-red-900! px-4 py-2 bg-red-200! hover:bg-red-300! rounded-none!"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductImageUploadForm
