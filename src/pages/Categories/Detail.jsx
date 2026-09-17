import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MoreVertical, Plus } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { categoryService } from '@/services/category.service'
import { uploadImageToStorage } from '@/utils/storage'
import Button from '@/components/ui/Button'
import CenterModal from '@/components/ui/CenterModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import Input from '@/components/ui/Input'
import TableSkeleton from '@/components/ui/TableSkeleton'
import Textarea from '@/components/ui/Textarea'

const emptySubCategoryForm = { name: '', description: '', image_url: '', image_storage_key: '', image_file: null }

const CategoryDetail = () => {
  const { id } = useParams()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [subCategoryModal, setSubCategoryModal] = useState({ open: false, subCategory: null })
  const [viewModal, setViewModal] = useState({ open: false, subCategory: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, subCategory: null })
  const [openActionsId, setOpenActionsId] = useState(null)
  const [formData, setFormData] = useState(emptySubCategoryForm)
  const [formErrors, setFormErrors] = useState({})

  const { data: categoryData, isLoading, isError } = useQuery({
    queryKey: ['categories', id],
    queryFn: () => categoryService.getCategoryById(id),
    enabled: Boolean(id),
  })

  const category = categoryData?.data
  const subCategories = category?.sub_categories || []

  const saveSubCategoryMutation = useMutation({
    mutationFn: ({ subCategoryId, payload }) =>
      subCategoryId
        ? categoryService.updateSubCategory(subCategoryId, payload)
        : categoryService.createSubCategory(payload),
    onSuccess: () => {
      toast.success('Subcategory Saved', 'Subcategory has been saved successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories', id] })
      setSubCategoryModal({ open: false, subCategory: null })
      setOpenActionsId(null)
      setFormData(emptySubCategoryForm)
      setFormErrors({})
    },
    onError: (error) => {
      toast.error('Save Failed', error.response?.data?.errors?.[0] || error.response?.data?.error || 'Failed to save subcategory')
    },
  })

  const deleteSubCategoryMutation = useMutation({
    mutationFn: categoryService.deleteSubCategory,
    onSuccess: () => {
      toast.success('Subcategory Deleted', 'Subcategory has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories', id] })
      setDeleteModal({ open: false, subCategory: null })
      setOpenActionsId(null)
    },
    onError: (error) => {
      toast.error('Deletion Failed', error.response?.data?.errors?.[0] || error.response?.data?.error || 'Failed to delete subcategory')
    },
  })

  const openCreateModal = () => {
    setFormData(emptySubCategoryForm)
    setFormErrors({})
    setSubCategoryModal({ open: true, subCategory: null })
  }

  const openEditModal = (subCategory) => {
    setFormData({
      name: subCategory.name || '',
      description: subCategory.description || '',
      image_url: subCategory.image_url || '',
      image_storage_key: subCategory.image_storage_key || '',
      image_file: null,
    })
    setFormErrors({})
    setSubCategoryModal({ open: true, subCategory })
    setOpenActionsId(null)
  }

  const handleSaveSubCategory = async () => {
    if (!formData.name.trim()) {
      setFormErrors({ name: 'Name is required' })
      return
    }

    let imageUrl = formData.image_url
    let imageStorageKey = formData.image_storage_key

    if (formData.image_file) {
      try {
        const uploaded = await uploadImageToStorage(formData.image_file)
        imageUrl = uploaded.url
        imageStorageKey = uploaded.storage_key
      } catch (error) {
        toast.error('Upload Failed', error.message || 'Failed to upload subcategory image')
        return
      }
    }

    saveSubCategoryMutation.mutate({
      subCategoryId: subCategoryModal.subCategory?.id,
      payload: {
        category_id: id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        image_url: imageUrl || null,
        image_storage_key: imageStorageKey || null,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 montserrat min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          <TableSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !category) {
    return (
      <div className="bg-gray-50 montserrat min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          <Link to="/categories" className="inline-flex items-center gap-2 text-sm text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Categories
          </Link>
          <div className="bg-white p-8 text-center text-gray-600">
            Category details could not be loaded.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <Link to="/categories" className="inline-flex items-center gap-2 text-sm text-primary mb-6">
          <ArrowLeft className="h-4 w-4" />
          Categories
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
            <p className="text-gray-600 max-w-3xl mt-1">{category.description || 'No description'}</p>
            <p className="text-sm text-gray-500 mt-2">{subCategories.length} subcategories</p>
          </div>
          <Button onClick={openCreateModal} className="w-full md:w-auto gap-2 text-sm cursor-pointer">
            <Plus className="w-4 h-4" />
            Add Subcategory
          </Button>
        </div>

        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subCategories.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      No subcategories found
                    </td>
                  </tr>
                ) : (
                  subCategories.map((subCategory) => (
                    <tr key={subCategory.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          {subCategory.image_url && (
                            <img src={subCategory.image_url} alt="" className="h-10 w-10 rounded object-cover bg-gray-100" />
                          )}
                          <span>{subCategory.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xl">
                        <div className="line-clamp-2">{subCategory.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative inline-flex justify-end">
                          <button
                            onClick={() => setOpenActionsId(openActionsId === subCategory.id ? null : subCategory.id)}
                            className="cursor-pointer inline-flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100"
                            title="Subcategory actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openActionsId === subCategory.id && (
                            <div className="absolute right-0 top-9 z-20 w-32 bg-white border border-gray-200 py-1 text-left">
                              <button
                                onClick={() => {
                                  setViewModal({ open: true, subCategory })
                                  setOpenActionsId(null)
                                }}
                                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openEditModal(subCategory)}
                                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteModal({ open: true, subCategory })
                                  setOpenActionsId(null)
                                }}
                                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <CenterModal
          open={subCategoryModal.open}
          onClose={() => {
            setSubCategoryModal({ open: false, subCategory: null })
            setFormData(emptySubCategoryForm)
            setFormErrors({})
          }}
          heading={subCategoryModal.subCategory ? 'Edit Subcategory' : 'Create Subcategory'}
        >
          <div className="space-y-4">
            <Input
              label="Subcategory Name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                setFormErrors({})
              }}
              error={formErrors.name}
              required
              placeholder="e.g., Phones, Shoes"
            />
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description for this subcategory"
              rows={3}
            />
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Subcategory Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image_file: e.target.files?.[0] || null })}
                className="block w-full text-sm text-gray-700"
              />
              {formData.image_url && !formData.image_file && (
                <img src={formData.image_url} alt="" className="mt-3 h-24 w-24 rounded object-cover bg-gray-100" />
              )}
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                onClick={() => setSubCategoryModal({ open: false, subCategory: null })}
                className="w-auto bg-gray-200! text-gray-700! border-gray-300 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSubCategory}
                isLoading={saveSubCategoryMutation.isPending}
                loadingText="Saving..."
                className="w-auto cursor-pointer"
              >
                Save Subcategory
              </Button>
            </div>
          </div>
        </CenterModal>

        <CenterModal
          open={viewModal.open}
          onClose={() => setViewModal({ open: false, subCategory: null })}
          heading="Subcategory Details"
        >
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Name</p>
              <p className="mt-1 text-sm text-gray-900">{viewModal.subCategory?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Description</p>
              <p className="mt-1 text-sm leading-6 text-gray-700">
                {viewModal.subCategory?.description || 'No description'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Category</p>
              <p className="mt-1 text-sm text-gray-900">{category.name}</p>
            </div>
          </div>
        </CenterModal>

        <ConfirmModal
          open={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, subCategory: null })}
          onConfirm={() => deleteModal.subCategory?.id && deleteSubCategoryMutation.mutate(deleteModal.subCategory.id)}
          title="Delete Subcategory"
          description={`Are you sure you want to delete "${deleteModal.subCategory?.name || 'this subcategory'}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          isLoading={deleteSubCategoryMutation.isPending}
        />
      </div>
    </div>
  )
}

export default CategoryDetail
