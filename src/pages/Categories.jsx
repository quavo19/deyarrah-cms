import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ImageIcon, MoreVertical, Plus } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { categoryService } from '@/services/category.service'
import { uploadImageToStorage } from '@/utils/storage'
import { SearchInput } from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import CenterModal from '@/components/ui/CenterModal'
import TableSkeleton from '@/components/ui/TableSkeleton'

const emptyCategoryForm = { name: '', description: '', image_url: '', image_storage_key: '', image_file: null }

const CategoryThumbnail = ({ src, alt = '' }) => {
  if (src) {
    return <img src={src} alt={alt} className="h-10 w-10 shrink-0 rounded-md object-cover bg-gray-100" />
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
      <ImageIcon className="h-4 w-4" />
    </div>
  )
}

const Categories = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, category: null })
  const [openActionsId, setOpenActionsId] = useState(null)
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)
  const [formErrors, setFormErrors] = useState({})
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories,
  })

  const categories = useMemo(() => categoriesData?.data || [], [categoriesData])
  const filteredCategories = categories.filter((category) => {
    if (!search) return true
    const searchLower = search.toLowerCase()

    return (
      category.name?.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower)
    )
  })

  const saveCategoryMutation = useMutation({
    mutationFn: ({ categoryId, payload }) =>
      categoryId
        ? categoryService.updateCategory(categoryId, payload)
        : categoryService.createCategory(payload),
    onSuccess: () => {
      toast.success('Category Saved', 'Category has been saved successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setCategoryModal({ open: false, category: null })
      setCategoryForm(emptyCategoryForm)
      setFormErrors({})
    },
    onError: (error) => {
      toast.error('Creation Failed', error.response?.data?.errors?.[0] || error.response?.data?.error || 'Failed to create category')
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: () => {
      toast.success('Category Deleted', 'Category has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleteModal({ open: false, category: null })
      setOpenActionsId(null)
    },
    onError: (error) => {
      toast.error('Deletion Failed', error.response?.data?.errors?.[0] || error.response?.data?.error || 'Failed to delete category')
    },
  })

  const openCreateModal = () => {
    setCategoryForm(emptyCategoryForm)
    setFormErrors({})
    setCategoryModal({ open: true, category: null })
  }

  const openEditModal = (category) => {
      setCategoryForm({
        name: category.name || '',
        description: category.description || '',
        image_url: category.image_url || '',
        image_storage_key: category.image_storage_key || '',
        image_file: null,
      })
    setFormErrors({})
    setCategoryModal({ open: true, category })
    setOpenActionsId(null)
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      setFormErrors({ name: 'Name is required' })
      return
    }

    setIsSavingCategory(true)

    let imageUrl = categoryForm.image_url
    let imageStorageKey = categoryForm.image_storage_key

    try {
      if (categoryForm.image_file) {
        const uploaded = await uploadImageToStorage(categoryForm.image_file)
        imageUrl = uploaded.url
        imageStorageKey = uploaded.storage_key
      }

      await saveCategoryMutation.mutateAsync({
        categoryId: categoryModal.category?.id,
        payload: {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
          image_url: imageUrl || null,
          image_storage_key: imageStorageKey || null,
        },
      })
    } catch (error) {
      if (!error.response) {
        toast.error('Upload Failed', error.message || 'Failed to upload category image')
      }
    } finally {
      setIsSavingCategory(false)
    }
  }

  return (
    <div className="bg-gray-50 montserrat">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col mb-6">
          <h1 className="text-lg sm:text-xl font-semibold">Category Management</h1>
          <p className="text-gray-600">Manage product categories.</p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full">
          <div className="w-full">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
            />
          </div>
          <Button onClick={openCreateModal} className="w-full md:w-auto gap-2 text-sm cursor-pointer">
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </div>

        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategories</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4">
                      <TableSkeleton />
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      {search ? 'No categories found matching your search' : 'No categories found'}
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <CategoryThumbnail src={category.image_url} alt={category.name} />
                          <button
                            onClick={() => navigate(`/categories/${category.id}`)}
                            className="cursor-pointer text-left text-sm font-medium text-gray-900 hover:underline"
                          >
                            {category.name}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xl">
                        <div className="line-clamp-2">{category.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.sub_categories_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative inline-flex justify-end">
                          <button
                            onClick={() => setOpenActionsId(openActionsId === category.id ? null : category.id)}
                            className="cursor-pointer inline-flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100"
                            title="Category actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openActionsId === category.id && (
                            <div className="absolute right-0 top-9 z-20 w-32 bg-white border border-gray-200 py-1 text-left">
                              <button
                                onClick={() => {
                                  navigate(`/categories/${category.id}`)
                                  setOpenActionsId(null)
                                }}
                                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openEditModal(category)}
                                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteModal({ open: true, category })
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
          open={categoryModal.open}
          onClose={() => {
            setCategoryModal({ open: false, category: null })
            setCategoryForm(emptyCategoryForm)
            setFormErrors({})
          }}
          heading={categoryModal.category ? 'Edit Category' : 'Create Category'}
        >
          <div className="space-y-4">
            <Input
              label="Category Name"
              value={categoryForm.name}
              onChange={(e) => {
                setCategoryForm({ ...categoryForm, name: e.target.value })
                setFormErrors({})
              }}
              error={formErrors.name}
              required
              placeholder="e.g., Electronics, Apparel"
            />
            <Textarea
              label="Description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Optional description for this category"
              rows={3}
            />
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Category Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCategoryForm({ ...categoryForm, image_file: e.target.files?.[0] || null })}
                className="block w-full text-sm text-gray-700"
              />
              {categoryForm.image_url && !categoryForm.image_file && (
                <img src={categoryForm.image_url} alt="" className="mt-3 h-24 w-24 rounded object-cover bg-gray-100" />
              )}
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button onClick={() => setCategoryModal({ open: false, category: null })} className="w-auto bg-gray-200! text-gray-700! border-gray-300 hover:bg-gray-50 cursor-pointer">
                Cancel
              </Button>
              <Button
                onClick={handleSaveCategory}
                isLoading={isSavingCategory}
                loadingText={categoryForm.image_file ? 'Uploading...' : 'Saving...'}
                className="w-auto cursor-pointer"
              >
                {categoryModal.category ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </CenterModal>

        <ConfirmModal
          open={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, category: null })}
          onConfirm={() => deleteModal.category?.id && deleteCategoryMutation.mutate(deleteModal.category.id)}
          title="Delete Category"
          description={`Are you sure you want to delete "${deleteModal.category?.name || 'this category'}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          isLoading={deleteCategoryMutation.isPending}
        />
      </div>
    </div>
  )
}

export default Categories
