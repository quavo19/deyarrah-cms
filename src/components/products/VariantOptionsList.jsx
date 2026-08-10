import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { productService } from '@/services/product.service'
import Button from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import VariantOptionImageUploadForm from './VariantOptionImageUploadForm'
import { Trash2, Settings, X, ImageIcon } from 'lucide-react'

const VariantOptionsList = ({ variantId, productId, editingOption, setEditingOption, setDeleteOptionModal, bookableType }) => {
  const [addImageForOption, setAddImageForOption] = useState(null)
  const [deleteImageModal, setDeleteImageModal] = useState(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const deleteImageMutation = useMutation({
    mutationFn: ({ variantId, optionId, imageId }) => 
      productService.deleteVariantOptionImage(variantId, optionId, imageId),
    onSuccess: () => {
      toast.success('Image Deleted', 'Image has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['variant-options', variantId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      setDeleteImageModal(null)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete image'
      toast.error('Deletion Failed', errorMessage)
    },
  })

  const { data: optionsData, isLoading } = useQuery({
    queryKey: ['variant-options', variantId],
    queryFn: () => productService.getVariantOptions(variantId),
    enabled: !!variantId,
  })

  const options = optionsData?.data || []

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 py-3 text-center">
        Loading options...
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
        No options found. Add an option to get started.
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const attrs = option.attributes || {}
          const isEditing = editingOption?.id === option.id && editingOption?.variantId === variantId
          
          if (isEditing) {
            return null 
          }

          const optionImages = attrs.images || []

          return (
            <div key={option.id} className="flex items-start justify-between gap-3 p-3 bg-white border border-gray-300">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-gray-900 capitalize">{attrs.name}</h2>
                  <span className="text-gray-400">-</span>
                  <span className="text-xs font-medium text-green-600">
                    GHS {parseFloat(attrs.price || 0).toFixed(2)}
                  </span>
                </div>
                {attrs.description && (
                  <p className="text-sm text-gray-500 mb-2">{attrs.description}</p>
                )}
                {optionImages.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {optionImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="p-2 bg-white border border-gray-200 rounded-lg">
                          <img
                            src={image.url}
                            alt={attrs.name}
                            className="w-16 h-16 object-cover rounded cursor-pointer"
                            onClick={() => window.open(image.url, '_blank')}
                          />
                        </div>
                        <button
                          onClick={() => setDeleteImageModal({ variantId, optionId: option.id, imageId: image.id })}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                          title="Delete image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {addImageForOption?.variantId === variantId && addImageForOption?.optionId === option.id && (
                  <VariantOptionImageUploadForm
                    variantId={variantId}
                    optionId={option.id}
                    productId={productId}
                    onSuccess={() => setAddImageForOption(null)}
                    onCancel={() => setAddImageForOption(null)}
                  />
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  onClick={() => {
                    setEditingOption({
                      id: option.id,
                      variantId: variantId,
                      name: attrs.name,
                      description: attrs.description || '',
                      price: attrs.price || '',
                      isNew: false
                    })
                  }}
                  auto
                  className="py-1 min-w-0 w-auto h-auto rounded-none! bg-transparent! text-gray-400! hover:text-gray-600! hover:bg-gray-100! cursor-pointer! "
                  title="Edit"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                </Button>
                <Button
                  onClick={() => {
                    if (addImageForOption?.variantId === variantId && addImageForOption?.optionId === option.id) {
                      setAddImageForOption(null)
                    } else {
                      setAddImageForOption({ variantId, optionId: option.id })
                    }
                  }}
                  auto
                  className="py-1 min-w-0 w-auto h-auto rounded-none! bg-transparent! hover:bg-orange-50! cursor-pointer! "
                  title={addImageForOption?.variantId === variantId && addImageForOption?.optionId === option.id ? "Cancel" : "Add Image"}
                >
                  {addImageForOption?.variantId === variantId && addImageForOption?.optionId === option.id ? (
                    <X className="w-4 h-4 text-red-500" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-primary" />
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setDeleteOptionModal({
                      variantId: variantId,
                      optionId: option.id,
                      optionName: attrs.name
                    })
                  }}
                  auto
                  disabled={bookableType === 'unit' && attrs.name === 'Standard'}
                  className="py-1 min-w-0 w-auto h-auto rounded-none! bg-transparent! text-red-500! hover:text-red-600! hover:bg-red-100! cursor-pointer! disabled:opacity-50! disabled:cursor-not-allowed! "
                  title={bookableType === 'unit' && attrs.name === 'Standard' ? 'Cannot delete Standard option' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmModal
        open={!!deleteImageModal}
        onClose={() => setDeleteImageModal(null)}
        onConfirm={() => {
          if (deleteImageModal) {
            deleteImageMutation.mutate(deleteImageModal)
          }
        }}
        title="Delete Image"
        description="Are you sure you want to delete this variant option image? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteImageMutation.isPending}
      />
    </>
  )
}

export default VariantOptionsList
