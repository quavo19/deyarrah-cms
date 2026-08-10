import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { productService } from '@/services/product.service'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Plus, Trash2, Settings, Tag } from 'lucide-react'

const ProductMetaSection = ({ productId }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showCreateMeta, setShowCreateMeta] = useState(false)
  const [editingMeta, setEditingMeta] = useState(null)
  const [deleteMetaModal, setDeleteMetaModal] = useState(null)
  const [newMeta, setNewMeta] = useState({ name: '', value: '' })

  const { data: metaData, isLoading } = useQuery({
    queryKey: ['product-meta', productId],
    queryFn: () => productService.getProductMeta(productId),
    enabled: !!productId,
  })

  const metaList = metaData?.data || []

  const createMetaMutation = useMutation({
    mutationFn: (data) => productService.createProductMeta(productId, data),
    onSuccess: () => {
      toast.success('Meta Created', 'Product meta has been created successfully')
      queryClient.invalidateQueries({ queryKey: ['product-meta', productId] })
      setShowCreateMeta(false)
      setNewMeta({ name: '', value: '' })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to create meta'
      toast.error('Creation Failed', errorMessage)
    },
  })

  const updateMetaMutation = useMutation({
    mutationFn: ({ metaId, data }) => productService.updateProductMeta(productId, metaId, data),
    onSuccess: () => {
      toast.success('Meta Updated', 'Product meta has been updated successfully')
      queryClient.invalidateQueries({ queryKey: ['product-meta', productId] })
      setEditingMeta(null)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to update meta'
      toast.error('Update Failed', errorMessage)
    },
  })

  const deleteMetaMutation = useMutation({
    mutationFn: (metaId) => productService.deleteProductMeta(productId, metaId),
    onSuccess: () => {
      toast.success('Meta Deleted', 'Product meta has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['product-meta', productId] })
      setDeleteMetaModal(null)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete meta'
      toast.error('Deletion Failed', errorMessage)
    },
  })

  const handleCreateMeta = () => {
    if (!newMeta.name.trim() || !newMeta.value.trim()) {
      toast.error('Validation Error', 'Both name and value are required')
      return
    }
    createMetaMutation.mutate(newMeta)
  }

  const handleUpdateMeta = (metaId) => {
    if (!editingMeta.name?.trim() || !editingMeta.value?.trim()) {
      toast.error('Validation Error', 'Both name and value are required')
      return
    }
    updateMetaMutation.mutate({
      metaId,
      data: {
        name: editingMeta.name,
        value: editingMeta.value,
      }
    })
  }

  return (
    <div className="rounded-lg w-full">
      <div className="">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Tag className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-semibold text-gray-900">Product Meta</h2>
              <p className="text-sm text-gray-500">
                Define meta information for the product
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateMeta(!showCreateMeta)}
            className="flex items-center gap-2 w-auto rounded-none! bg-green-600! text-white! hover:bg-green-700! text-sm! px-3! py-1.5!"
          >
            <Plus className="w-4 h-4" />
            {showCreateMeta ? 'Cancel' : 'Add Meta'}
          </Button>
        </div>

        {showCreateMeta && (
          <div className="mb-6 p-4 bg-white  border border-gray-200">
            <h3 className="text-sm font-medium mb-3">Create New Meta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Name"
                value={newMeta.name}
                onChange={(e) => setNewMeta({ ...newMeta, name: e.target.value })}
                placeholder="e.g., weight, dimensions"
                required
              />
              <Input
                label="Value"
                value={newMeta.value}
                onChange={(e) => setNewMeta({ ...newMeta, value: e.target.value })}
                placeholder="e.g., 2.5kg, 10x20x5cm"
                required
              />
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleCreateMeta}
                disabled={createMetaMutation.isPending}
                className="rounded-none! bg-green-600! text-white! hover:bg-green-700! text-sm! px-3! py-1.5! cursor-pointer! "
              >
                Create Meta
              </Button>
              <Button
                onClick={() => {
                  setShowCreateMeta(false)
                  setNewMeta({ name: '', value: '' })
                }}
                className="bg-gray-200! text-gray-700! hover:bg-gray-300! text-xs! rounded-none!"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500 px-4 sm:px-6">Loading meta...</div>
      ) : metaList.length === 0 ? (
        <div className="text-center py-8 text-gray-500 px-4 sm:px-6">
          No meta information found. Add meta to get started.
        </div>
      ) : (
        <div className="overflow-x-auto w-full bg-white border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 w-full">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metaList.map((meta) => {
                const attrs = meta.attributes || {}
                const isEditing = editingMeta?.id === meta.id
                
                return (
                  <tr key={meta.id}>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input
                          value={editingMeta.name || attrs.name}
                          onChange={(e) => setEditingMeta({ ...editingMeta, name: e.target.value })}
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{attrs.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input
                          value={editingMeta.value || attrs.value}
                          onChange={(e) => setEditingMeta({ ...editingMeta, value: e.target.value })}
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{attrs.value}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUpdateMeta(meta.id)}
                            disabled={updateMetaMutation.isPending}
                            className=" rounded-none! bg-green-600! text-white! hover:bg-green-700! text-sm! px-3! py-1.5! cursor-pointer! "
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingMeta(null)}
                            className="bg-gray-200! text-gray-700! hover:bg-gray-300! text-xs! rounded-none!"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingMeta({ id: meta.id, name: attrs.name, value: attrs.value })}
                            className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                            title="Edit"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteMetaModal(meta)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!deleteMetaModal}
        onClose={() => setDeleteMetaModal(null)}
        onConfirm={() => {
          if (deleteMetaModal) {
            deleteMetaMutation.mutate(deleteMetaModal.id)
          }
        }}
        title="Delete Meta"
        description={
          deleteMetaModal
            ? `Are you sure you want to delete "${deleteMetaModal.attributes?.name}"?`
            : ''
        }
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMetaMutation.isPending}
      />
    </div>
  )
}

export default ProductMetaSection
