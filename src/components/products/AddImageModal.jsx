import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import CenterModal from '@/components/ui/CenterModal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ImageIcon } from 'lucide-react'

const AddImageModal = ({ open, onClose, productId, variantId, optionId, onSuccess }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [imageUrl, setImageUrl] = useState('')
  const [errors, setErrors] = useState({})

  const createProductImageMutation = useMutation({
    mutationFn: async (url) => {
      const { productService } = await import('@/services/product.service')
      return productService.createProductImage(productId, url)
    },
    onSuccess: () => {
      toast.success('Image Added', 'Image has been added successfully')
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      if (onSuccess) onSuccess()
      handleClose()
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to add image'
      toast.error('Error', errorMessage)
    },
  })

  const createVariantOptionImageMutation = useMutation({
    mutationFn: async (url) => {
      const { productService } = await import('@/services/product.service')
      return productService.createVariantOptionImage(variantId, optionId, url)
    },
    onSuccess: () => {
      toast.success('Image Added', 'Image has been added successfully')
      queryClient.invalidateQueries({ queryKey: ['variant-options', variantId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      if (onSuccess) onSuccess()
      handleClose()
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to add image'
      toast.error('Error', errorMessage)
    },
  })

  const handleClose = () => {
    setImageUrl('')
    setErrors({})
    onClose()
  }

  const validateForm = () => {
    const newErrors = {}
    if (!imageUrl.trim()) {
      newErrors.imageUrl = 'Image URL is required'
    } else {
      try {
        new URL(imageUrl)
      } catch {
        newErrors.imageUrl = 'Please enter a valid URL'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    if (variantId && optionId) {
      createVariantOptionImageMutation.mutate(imageUrl.trim())
    } else {
      createProductImageMutation.mutate(imageUrl.trim())
    }
  }

  const isLoading = createProductImageMutation.isPending || createVariantOptionImageMutation.isPending

  return (
    <CenterModal
      open={open}
      onClose={handleClose}
      heading="Add Image"
      description={variantId && optionId 
        ? "Add an image for this variant option by providing a URL."
        : "Add an image for this product by providing a URL."}
      className="max-w-lg"
    >
      <div className="space-y-4">
        <Input
          label="Image URL"
          name="imageUrl"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value)
            if (errors.imageUrl) {
              setErrors(prev => ({ ...prev, imageUrl: undefined }))
            }
          }}
          placeholder="https://image-url.local/image.jpg"
          required
          error={errors.imageUrl}
        />

        {imageUrl && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-48 object-contain rounded"
                onError={() => {
                  setErrors(prev => ({ ...prev, imageUrl: 'Invalid image URL or image cannot be loaded' }))
                }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 sm:flex-initial bg-gray-200! text-gray-700! border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            isLoading={isLoading}
            loadingText="Adding..."
            className="flex-1 sm:flex-initial flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            Add Image
          </Button>
        </div>
      </div>
    </CenterModal>
  )
}

export default AddImageModal
