import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { productService } from '@/services/product.service'
import Button from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import ProductImageUploadForm from './ProductImageUploadForm'
import { ImageIcon, Plus, X, Trash2 } from 'lucide-react'
import Image from '../ui/Image'

const ProductImagesSection = ({ productId, images = [] }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showAddImage, setShowAddImage] = useState(false)
  const [deleteImageModal, setDeleteImageModal] = useState(null)

  const deleteImageMutation = useMutation({
    mutationFn: ({ productId, imageId }) => productService.deleteProductImage(productId, imageId),
    onSuccess: () => {
      toast.success('Image Deleted', 'Image has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      setDeleteImageModal(null)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete image'
      toast.error('Deletion Failed', errorMessage)
    },
  })

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <ImageIcon className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-gray-900">Product Images</h2>
            <p className="text-sm text-gray-500">
              Manage product images
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddImage(!showAddImage)}
          auto
          className="px-3 py-1.5 text-sm bg-green-600! text-white! hover:bg-green-700! flex items-center gap-1.5 rounded-none!"
        >
          {showAddImage ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Image
            </>
          )}
        </Button>
      </div>

      {showAddImage && (
        <ProductImageUploadForm
          productId={productId}
          onSuccess={() => setShowAddImage(false)}
          onCancel={() => setShowAddImage(false)}
        />
      )}

      {images && images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group bg-white overflow-hidden">
              <div className="">
                <Image
                  src={image.url}
                  alt={image.name || 'Product image'}
                  className="w-full h-48! rounded cursor-pointer bg-transparent!"
                  onClick={() => window.open(image.url, '_blank')}
                />
              </div>
              <button
                onClick={() => setDeleteImageModal({ productId, imageId: image.id, imageUrl: image.url })}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No images added yet</p>
        </div>
      )}

      <ConfirmModal
        open={!!deleteImageModal}
        onClose={() => setDeleteImageModal(null)}
        onConfirm={() => {
          if (deleteImageModal) {
            deleteImageMutation.mutate(deleteImageModal)
          }
        }}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteImageMutation.isPending}
      />
    </div>
  )
}

export default ProductImagesSection
