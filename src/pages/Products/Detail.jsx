import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { productService } from '@/services/product.service'
import { categoryService } from '@/services/category.service'
import BackButton from '@/components/ui/BackButton'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { SlideToggle } from '@/components/ui/SlideToggle'
import Badge from '@/components/ui/Badge'
import ProductVariantsSection from '@/components/products/ProductVariantsSection'
import ProductMetaSection from '@/components/products/ProductMetaSection'
import ProductVariantStocksSection from '@/components/products/ProductVariantStocksSection'
import ProductImagesSection from '@/components/products/ProductImagesSection'
import { Trash2, X, Package, Tag, FileText, Grid3x3, Settings, Truck } from 'lucide-react'

const ProductDetail = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { id } = useParams()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    active: true,
    category_id: '',
    delivery_rate_per_km: '',
  })

  const {
    data: productData,
    isLoading,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  })

  const product = productData?.data
  const attrs = product?.attributes || {}

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories,
  })

  const categoryOptions = categoriesData?.data
    ? [
        { value: '', label: 'Select a category' },
        ...categoriesData.data.map((category) => ({
          value: category.id,
          label: category.attributes?.name || category.id,
        })),
      ]
    : [{ value: '', label: 'Loading categories...' }]


  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      toast.success('Product Deleted', 'Product has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      navigate('/inventory/products')
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 
                         'Failed to delete product'
      toast.error('Deletion Failed', errorMessage)
    },
  })

  const updateProductMutation = useMutation({
    mutationFn: (data) => productService.updateProduct(id, data),
    onSuccess: () => {
      toast.success('Product Updated', 'Product has been updated successfully')
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsEditingProduct(false)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 
                         'Failed to update product'
      toast.error('Update Failed', errorMessage)
    },
  })


  const handleDelete = () => {
    if (product) {
      deleteMutation.mutate(product.id)
    }
  }

  const handleStartEdit = () => {
    setEditFormData({
      name: attrs.name || '',
      description: attrs.description || '',
      active: attrs.active !== false,
      category_id: attrs.category_id || attrs.category?.id || '',
      delivery_rate_per_km: attrs.delivery_rate_per_km || '',
    })
    setIsEditingProduct(true)
  }

  const handleCancelEdit = () => {
    setIsEditingProduct(false)
    setEditFormData({
      name: attrs.name || '',
      description: attrs.description || '',
      active: attrs.active !== false,
      category_id: attrs.category_id || attrs.category?.id || '',
      delivery_rate_per_km: attrs.delivery_rate_per_km || '',
    })
  }

  const handleSaveEdit = () => {
    if (!editFormData.name.trim()) {
      toast.error('Validation Error', 'Product name is required')
      return
    }

    updateProductMutation.mutate({
      name: editFormData.name,
      description: editFormData.description || '',
      active: editFormData.active,
      category_id: editFormData.category_id || null,
      delivery_rate_per_km: editFormData.delivery_rate_per_km || null,
    })
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleActiveToggle = (value) => {
    setEditFormData(prev => ({
      ...prev,
      active: value
    }))
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen montserrat py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TableSkeleton />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="bg-gray-50 min-h-screen montserrat py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Product not found</p>
            <button
              onClick={() => navigate('/inventory/products')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-gray-50 min-h-screen montserrat py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton>
              Back
            </BackButton>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{attrs.name || 'Product'}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                {attrs.description || 'Product details and inventory management'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
           <div className="flex items-center justify-between mb-4"> 
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-base font-semibold text-gray-900">Product Information</h2>
                <p className="text-sm text-gray-500">
                  Define product information
                </p>
              </div>
            </div>
             <div className="flex items-center gap-2">
              {!isEditingProduct ? (
                <>
                  <Button
                    onClick={handleStartEdit}
                    auto
                    className="px-3 py-1.5 text-sm bg-gray-50! cursor-pointer text-gray-700! transition-colors border border-gray-300! hover:bg-gray-100! flex items-center gap-1.5 rounded-lg!"
                  >
                    <Settings className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => setDeleteModalOpen(true)}
                    auto
                    className="px-3 py-1.5 text-sm bg-red-50! cursor-pointer text-red-600! transition-colors border border-red-400! hover:bg-red-100! flex items-center gap-1.5 rounded-lg!"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={updateProductMutation.isPending}
                    auto
                    className="px-3 py-1.5 text-sm rounded-lg!"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    auto
                    className="px-3 py-1.5 text-sm bg-gray-100! text-gray-700! hover:bg-gray-300! transition-colors border border-gray-300! flex items-center gap-1.5 rounded-lg!"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div></div>
            <div className="bg-white p-4 sm:p-6 rounded-lg  border-gray-200">
             {isEditingProduct ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <Input
                      label="Product Name"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditFormChange}
                      required
                      inputClassName=" py-[5px]! text-sm rounded-lg!"
                    />
                    <Textarea
                      label="Description"
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditFormChange}
                      rows={2}
                      textareaClassName=" py-[5px]! text-sm rounded-lg!"
                    />
                    <Select
                      label="Category"
                      name="category_id"
                      value={editFormData.category_id}
                      onChange={handleEditFormChange}
                      options={categoryOptions}
                      selectClassName=" py-[5px]! text-sm rounded-lg!"
                    />
                    <SlideToggle
                      label="Active Status"
                      value={editFormData.active}
                      onChange={handleActiveToggle}
                      onLabel="Active"
                      offLabel="Inactive"
                    />
                    <Input
                      label="Delivery Rate Per KM (GHS)"
                      name="delivery_rate_per_km"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editFormData.delivery_rate_per_km || ''}
                      onChange={handleEditFormChange}
                      placeholder="0.00"
                      inputClassName=" py-[5px]! text-sm rounded-lg!"
                    />
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                    <Tag className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <dt className="text-sm font-light text-gray-500 mb-1">Name</dt>
                    <dd className="text-sm text-gray-900 font-light">{attrs.name || '—'}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                    <Grid3x3 className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <dt className="text-sm font-light text-gray-500 mb-1">Category</dt>
                    <dd className="text-sm text-gray-900 font-light">{attrs.category?.name || '—'}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                    <Package className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <dt className="text-sm font-light text-gray-500 mb-1">Type</dt>
                    <dd className="mt-1">
                      <Badge variant={attrs.bookable_type === 'bulk' ? 'info' : 'success'}>
                        {attrs.bookable_type || '—'}
                      </Badge>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                    <Settings className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <dt className="text-sm font-light text-gray-500 mb-1">Status</dt>
                    <dd className="mt-1">
                      <Badge variant={attrs.active ? 'success' : 'still'}>
                        {attrs.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </dd>
                  </div>
                </div>
                
                {attrs.description && (
                  <div className="md:col-span-2 flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <dt className="text-sm font-medium text-gray-500 mb-1">Description</dt>
                      <dd className="text-sm text-gray-900 leading-relaxed">{attrs.description}</dd>
                    </div>
                  </div>
                )}
                {attrs.delivery_rate_per_km !== undefined && attrs.delivery_rate_per_km !== null && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                      <Truck className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <dt className="text-sm font-light text-gray-500 mb-1">Delivery Rate Per KM</dt>
                      <dd className="text-sm text-gray-900 font-light">
                        {attrs.delivery_rate_per_km ? `GHS ${parseFloat(attrs.delivery_rate_per_km).toFixed(2)}` : '—'}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            )}
            </div>
           <ProductImagesSection productId={id} images={attrs.images || []} />
          </div>

          <ProductVariantsSection productId={id} bookableType={attrs.bookable_type} />

          <ProductMetaSection productId={id} />

          <ProductVariantStocksSection productId={id} bookableType={attrs.bookable_type} />
        </div>

        <ConfirmModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Product"
          description={`Are you sure you want to delete "${attrs.name}"? This action cannot be undone and will delete all associated variants, stocks, and images.`}
          confirmText="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  )
}

export default ProductDetail
