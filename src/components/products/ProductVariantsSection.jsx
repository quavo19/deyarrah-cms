import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { productService } from '@/services/product.service'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import VariantOptionsList from './VariantOptionsList'
import { useExpandedVariants } from './hooks/useExpandedVariants'
import { Plus, Trash2, Settings, ChevronDown, ChevronUp, Package, MoreVertical, X, Check } from 'lucide-react'

const ProductVariantsSection = ({ productId, bookableType }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showCreateVariant, setShowCreateVariant] = useState(false)
  const [editingVariant, setEditingVariant] = useState(null)
  const [editingOption, setEditingOption] = useState(null)
  const [deleteVariantModal, setDeleteVariantModal] = useState(null)
  const [deleteOptionModal, setDeleteOptionModal] = useState(null)
  const [newVariant, setNewVariant] = useState({ name: '', description: '' })
  const [newOption, setNewOption] = useState({ name: '', description: '', price: '' })

  const { data: variantsData, isLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => productService.getProductVariants(productId),
    enabled: !!productId,
  })

  const variants = useMemo(() => variantsData?.data || [], [variantsData?.data])
  const [expandedVariants, toggleVariant] = useExpandedVariants(bookableType, variants)

  useQuery({
    queryKey: ['variant-stocks', productId],
    queryFn: () => productService.getVariantStocks({ product_id: productId }),
    enabled: !!productId,
  })

  const createVariantMutation = useMutation({
    mutationFn: (data) => productService.createVariant(productId, data),
    onSuccess: () => {
      toast.success('Variant Created', 'Variant has been created successfully')
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      queryClient.invalidateQueries({ queryKey: ['variant-options-batch', productId] })
      setShowCreateVariant(false)
      setNewVariant({ name: '', description: '' })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to create variant'
      toast.error('Creation Failed', errorMessage)
    },
  })

  const updateVariantMutation = useMutation({
    mutationFn: ({ variantId, data }) => productService.updateVariant(variantId, data),
    onSuccess: () => {
      toast.success('Variant Updated', 'Variant has been updated successfully')
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      setEditingVariant(null)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to update variant'
      toast.error('Update Failed', errorMessage)
    },
  })

  const deleteVariantMutation = useMutation({
    mutationFn: productService.deleteVariant,
    onSuccess: () => {
      toast.success('Variant Deleted', 'Variant has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      queryClient.invalidateQueries({ queryKey: ['variant-stocks', productId] })
      queryClient.invalidateQueries({ queryKey: ['variant-options-batch', productId] })
      setDeleteVariantModal(null)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete variant'
      toast.error('Deletion Failed', errorMessage)
    },
  })

  const createOptionMutation = useMutation({
    mutationFn: ({ variantId, data }) => productService.createVariantOption(variantId, data),
    onSuccess: (_, variables) => {
      toast.success('Option Created', 'Option has been created successfully')
      queryClient.invalidateQueries({ queryKey: ['variant-stocks', productId] })
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      queryClient.invalidateQueries({ queryKey: ['variant-options', variables.variantId] })
      queryClient.invalidateQueries({ queryKey: ['variant-options-batch', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.refetchQueries({ queryKey: ['variant-stocks', productId] })
      setNewOption({ name: '', description: '', price: '' })
      setEditingOption(null)
      toast.info('Variant Stocks Update', 'Please review and update variant stocks after adding new options')
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to create option'
      toast.error('Creation Failed', errorMessage)
    },
  })

  const updateOptionMutation = useMutation({
    mutationFn: ({ variantId, optionId, data }) => productService.updateVariantOption(variantId, optionId, data),
    onSuccess: (_, variables) => {
      toast.success('Option Updated', 'Option has been updated successfully')
      queryClient.invalidateQueries({ queryKey: ['variant-stocks', productId] })
      queryClient.invalidateQueries({ queryKey: ['variant-options', variables.variantId] })
      queryClient.invalidateQueries({ queryKey: ['variant-options-batch', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.refetchQueries({ queryKey: ['variant-stocks', productId] })
      setEditingOption(null)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to update option'
      toast.error('Update Failed', errorMessage)
    },
  })

  const deleteOptionMutation = useMutation({
    mutationFn: ({ variantId, optionId }) => productService.deleteVariantOption(variantId, optionId),
    onSuccess: (_, variables) => {
      toast.success('Option Deleted', 'Option has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['variant-stocks', productId] })
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      queryClient.invalidateQueries({ queryKey: ['variant-options', variables.variantId] })
      queryClient.invalidateQueries({ queryKey: ['variant-options-batch', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.refetchQueries({ queryKey: ['variant-stocks', productId] })
      setDeleteOptionModal(null)
      toast.info('Variant Stocks Update', 'Variant stocks have been updated. Please review them.')
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete option'
      toast.error('Deletion Failed', errorMessage)
    },
  })

  const handleCreateVariant = () => {
    if (!newVariant.name.trim()) {
      toast.error('Validation Error', 'Variant name is required')
      return
    }
    createVariantMutation.mutate(newVariant)
  }

  const handleUpdateVariant = (variantId) => {
    const variant = variants.find(v => v.id === variantId)
    if (!variant) return
    
    const data = {
      name: editingVariant.name || variant.attributes.name,
      description: editingVariant.description || variant.attributes.description || '',
    }
    
    if (!data.name.trim()) {
      toast.error('Validation Error', 'Variant name is required')
      return
    }
    
    updateVariantMutation.mutate({ variantId, data })
  }

  const handleCreateOption = (variantId) => {
    if (!newOption.name.trim()) {
      toast.error('Validation Error', 'Option name is required')
      return
    }
    if (!newOption.price || parseFloat(newOption.price) < 0) {
      toast.error('Validation Error', 'Valid price is required')
      return
    }
    
    createOptionMutation.mutate({
      variantId,
      data: {
        name: newOption.name,
        description: newOption.description || '',
        price: newOption.price,
      }
    })
  }

  const handleUpdateOption = (variantId, optionId) => {
    if (!editingOption.name?.trim()) {
      toast.error('Validation Error', 'Option name is required')
      return
    }
    if (editingOption.price !== undefined && (isNaN(parseFloat(editingOption.price)) || parseFloat(editingOption.price) < 0)) {
      toast.error('Validation Error', 'Valid price is required')
      return
    }
    
    updateOptionMutation.mutate({
      variantId,
      optionId,
      data: {
        name: editingOption.name,
        description: editingOption.description || '',
        price: editingOption.price?.toString(),
      }
    })
  }

  return (
    <div className=" border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Package className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-gray-900 text-base font-semibold">Variants</h2>
            <p className="text-sm text-gray-500">
              Define variant types (e.g., Size, Color) and their options
            </p>
          </div>
        </div>
        {bookableType !== 'unit' && (
          <Button
            onClick={() => setShowCreateVariant(!showCreateVariant)}
            auto
            className="flex items-center gap-2 bg-green-600! text-white! hover:bg-green-700! text-sm! px-4! py-2! rounded-none!"
          >
            {showCreateVariant ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Variant
              </>
            )}
          </Button>
        )}
      </div>

      {showCreateVariant && (
        <div className="mb-6 p-5 bg-white border border-gray-300">
          <h3 className="text-base text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-green-600" />
            Create New Variant
          </h3>
          <div className="space-y-4">
            <Input
              label="Variant Name"
              value={newVariant.name}
              onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
              placeholder="e.g., Size, Color"
              required
              inputClassName="text-sm! py-[6px]! rounded-none!"
            />
            <Textarea
              label="Description"
              value={newVariant.description}
              onChange={(e) => setNewVariant({ ...newVariant, description: e.target.value })}
              placeholder="Optional description"
              textareaClassName="text-sm! py-[6px]! rounded-none!"
            />
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreateVariant}
                disabled={createVariantMutation.isPending}
                auto
                className="rounded-none! bg-green-600! text-white! hover:bg-green-700! text-sm! px-3! py-1.5! cursor-pointer! "
              >
                <Check className="w-4 h-4 mr-1" />
                Create Variant
              </Button>
              <Button
                onClick={() => {
                  setShowCreateVariant(false)
                  setNewVariant({ name: '', description: '' })
                }}
                auto
                className="bg-gray-200! text-gray-700! hover:bg-gray-300! text-sm! rounded-none!"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading variants...</div>
      ) : variants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No variants found. Add a variant to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant) => {
            const isExpanded = expandedVariants.has(variant.id)
            const isEditing = editingVariant?.id === variant.id
            const attrs = variant.attributes || {}
            const isBaseVariant = bookableType === 'unit' && (attrs.name === 'Base' || attrs.pricing_role === 'base')
            
            return (
              <div key={variant.id} className="border border-gray-300 overflow-hidden">
                <div className="p-2 bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            label="Variant Name"
                            value={editingVariant.name || attrs.name}
                            onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                            placeholder="e.g., Size, Color"
                            inputClassName="text-sm! py-[6px]! rounded-none!"
                            disabled={isBaseVariant}
                          />
                          <Textarea
                            label="Description"
                            value={editingVariant.description || attrs.description || ''}
                            onChange={(e) => setEditingVariant({ ...editingVariant, description: e.target.value })}
                            placeholder="Optional description"
                            textareaClassName="text-sm! py-[6px]! rounded-none!"
                            disabled={isBaseVariant}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateVariant(variant.id)}
                              disabled={updateVariantMutation.isPending || isBaseVariant}
                              auto
                              className="rounded-none! bg-green-600! text-white! hover:bg-green-700! text-sm! px-3! py-1.5! cursor-pointer! "
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={() => setEditingVariant(null)}
                              auto
                              className="bg-gray-200! text-gray-700! hover:bg-gray-300! text-sm! rounded-none!"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-900 capitalize">{attrs.name}</h3>
                            {attrs.description && (
                              <p className="text-sm text-gray-500 mt-1">{attrs.description}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center">
                        <Button
                          onClick={() => toggleVariant(variant.id)}
                          auto
                          className="py-1 min-w-0 w-auto h-auto rounded-none! bg-transparent! text-gray-400! hover:text-gray-600! hover:bg-gray-100! cursor-pointer! "
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? (
                            <ChevronUp strokeWidth={1.5} className="w-6 h-6" />
                          ) : (
                            <ChevronDown strokeWidth={1.5} className="w-6 h-6" />
                          )}
                        </Button>
                        {!isBaseVariant && (
                          <>
                            <Button
                              onClick={() => setEditingVariant({ id: variant.id, name: attrs.name, description: attrs.description || '' })}
                              auto
                              className="py-1 min-w-0 w-auto h-auto rounded-none! bg-transparent! text-gray-400! hover:text-gray-600! hover:bg-gray-100! cursor-pointer! "
                              title="Edit"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => setDeleteVariantModal(variant)}
                              auto
                              className="py-1 min-w-0 w-auto h-auto rounded-none! bg-transparent! text-red-500! hover:text-red-600! hover:bg-red-100! cursor-pointer! "
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-5 bg-linear-to-br from-gray-50 to-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                        Options
                      </h4>
                      {!isBaseVariant && (
                        <Button
                          onClick={() => {
                            setNewOption({ name: '', description: '', price: '' })
                            setEditingOption({ variantId: variant.id, isNew: true })
                          }}
                          auto
                          className="rounded-none! bg-green-600! text-white! hover:bg-green-700! text-sm! px-3! py-1.5! cursor-pointer! flex items-center gap-1.5!"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Option
                        </Button>
                      )}
                    </div>

                    {editingOption?.variantId === variant.id && (
                      <div className="mb-4 p-4 bg-white border-b border-gray-300">
                        <div className="space-y-3">
                          <Input
                            label="Option Name"
                            value={editingOption.isNew ? newOption.name : (editingOption.name || '')}
                            onChange={(e) => {
                              if (editingOption.isNew) {
                                setNewOption({ ...newOption, name: e.target.value })
                              } else {
                                setEditingOption({ ...editingOption, name: e.target.value })
                              }
                            }}
                            inputClassName="text-sm! py-[6px]! rounded-none!"
                            placeholder="e.g., Small, Red"
                            required
                            disabled={bookableType === 'unit' && !editingOption.isNew && editingOption.name === 'Standard'}
                          />
                          <Input
                            label="Price"
                            type="number"
                            step="0.01"
                            inputClassName="text-sm! py-[6px]! rounded-none!"
                            min="0"
                            value={editingOption.isNew ? newOption.price : (editingOption.price || '')}
                            onChange={(e) => {
                              if (editingOption.isNew) {
                                setNewOption({ ...newOption, price: e.target.value })
                              } else {
                                setEditingOption({ ...editingOption, price: e.target.value })
                              }
                            }}
                            placeholder="0.00"
                            required
                          />
                          <Textarea
                            label="Description"
                            value={editingOption.isNew ? newOption.description : (editingOption.description || '')}
                            onChange={(e) => {
                              if (editingOption.isNew) {
                                setNewOption({ ...newOption, description: e.target.value })
                              } else {
                                setEditingOption({ ...editingOption, description: e.target.value })
                              }
                            }}
                            textareaClassName="text-sm! py-[6px]! rounded-none!"
                            placeholder="Optional"
                            disabled={bookableType === 'unit' && !editingOption.isNew && editingOption.name === 'Standard'}
                          />
                          <div className="flex gap-2 pt-1">
                            <Button
                              onClick={() => {
                                if (editingOption.isNew) {
                                  handleCreateOption(variant.id)
                                } else {
                                  handleUpdateOption(variant.id, editingOption.id)
                                }
                              }}
                              disabled={createOptionMutation.isPending || updateOptionMutation.isPending}
                              auto
                              className="rounded-none! bg-green-600! text-white! hover:bg-green-700! text-sm! px-3! py-1.5! cursor-pointer! "
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {editingOption.isNew ? 'Create' : 'Save'}
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingOption(null)
                                setNewOption({ name: '', description: '', price: '' })
                              }}
                              auto
                              className="bg-gray-200! text-gray-700! hover:bg-gray-300! text-xs! rounded-none!"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <VariantOptionsList 
                      variantId={variant.id} 
                      productId={productId} 
                      editingOption={editingOption} 
                      setEditingOption={setEditingOption} 
                      setDeleteOptionModal={setDeleteOptionModal}
                      bookableType={bookableType}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={!!deleteVariantModal}
        onClose={() => setDeleteVariantModal(null)}
        onConfirm={() => {
          if (deleteVariantModal) {
            deleteVariantMutation.mutate(deleteVariantModal.id)
          }
        }}
        title="Delete Variant"
        description={
          deleteVariantModal
            ? `Are you sure you want to delete "${deleteVariantModal.attributes?.name}"? This will also delete all its options and related variant stocks.`
            : ''
        }
        confirmText="Delete"
        variant="danger"
        isLoading={deleteVariantMutation.isPending}
      />

      <ConfirmModal
        open={!!deleteOptionModal}
        onClose={() => setDeleteOptionModal(null)}
        onConfirm={() => {
          if (deleteOptionModal) {
            deleteOptionMutation.mutate({
              variantId: deleteOptionModal.variantId,
              optionId: deleteOptionModal.optionId,
            })
          }
        }}
        title="Delete Option"
        description={
          deleteOptionModal
            ? `Are you sure you want to delete "${deleteOptionModal.optionName}"? This will also delete related variant stocks.`
            : 'Are you sure you want to delete this option? This will also delete related variant stocks.'
        }
        confirmText="Delete"
        variant="danger"
        isLoading={deleteOptionMutation.isPending}
      />
    </div>
  )
}

export default ProductVariantsSection
