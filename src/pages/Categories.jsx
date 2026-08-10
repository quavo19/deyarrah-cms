import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { categoryService } from '@/services/category.service'
import { SearchInput } from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import CenterModal from '@/components/ui/CenterModal'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { Plus, Trash2 } from 'lucide-react'

const Categories = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [formErrors, setFormErrors] = useState({})

  const {
    data: categoriesData,
    isLoading,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories,
  })


  const categories = categoriesData?.data || []
  const filteredCategories = categories.filter(category => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      category?.name?.toLowerCase().includes(searchLower) ||
      category?.description?.toLowerCase().includes(searchLower)
    )
  })

    console.log(categories)


  const createMutation = useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: () => {
      toast.success('Category Created', 'Category has been created successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setCreateModalOpen(false)
      setFormData({ name: '', description: '' })
      setFormErrors({})
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.errors?.[0] ||
                         'Failed to create category'
      toast.error('Creation Failed', errorMessage)
      if (error.response?.data?.errors) {
        setFormErrors({ name: error.response.data.errors[0] })
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: () => {
      toast.success('Category Deleted', 'Category has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleteModalOpen(false)
      setSelectedCategory(null)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 
                         'Failed to delete category'
      toast.error('Deletion Failed', errorMessage)
    },
  })

  const handleCreate = () => {
    setFormErrors({})
    if (!formData.name.trim()) {
      setFormErrors({ name: 'Name is required' })
      return
    }
    createMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    })
  }

  const handleDeleteClick = (category) => {
    setSelectedCategory(category)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id)
    }
  }

  return (
    <div className="bg-gray-50 montserrat">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col mb-6">
          <div>
            <h1 className="text-2xl font-bold">Category Management</h1>
            <p className="text-gray-600">Manage product categories.</p>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4 w-full">
          <div className="w-full">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
            />
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 w-full max-w-xs text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Category
          </Button>
        </div>

        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
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
                        <div className="text-sm font-medium text-gray-900">
                          {category?.name}
                        </div>
                      </td>
                      {/* <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md truncate">
                          {category?.description || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {category?.created_at
                            ? new Date(category.attributes.created_at).toLocaleDateString()
                            : '—'}
                        </div>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <CenterModal
          open={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false)
            setFormData({ name: '', description: '' })
            setFormErrors({})
          }}
          heading="Create Category"
        >
          <div className="space-y-4">
            <Input
              label="Category Name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (formErrors.name) {
                  setFormErrors({ ...formErrors, name: '' })
                }
              }}
              error={formErrors.name}
              required
              placeholder="e.g., Electronics, Apparel"
            />
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description for this category"
              rows={3}
            />
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                onClick={() => {
                  setCreateModalOpen(false)
                  setFormData({ name: '', description: '' })
                  setFormErrors({})
                }}
                className="bg-gray-200! text-gray-700! border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                isLoading={createMutation.isPending}
                loadingText="Creating..."
              >
                Create Category
              </Button>
            </div>
          </div>
        </CenterModal>

        <ConfirmModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false)
            setSelectedCategory(null)
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Category"
          description={
            selectedCategory
              ? `Are you sure you want to delete "${selectedCategory.attributes?.name}"? This action cannot be undone. Categories with associated products cannot be deleted.`
              : ''
          }
          confirmText="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  )
}

export default Categories
