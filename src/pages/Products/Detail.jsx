import { useMemo, useState } from 'react'
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
import { Trash2, X, Package, Tag, FileText, Grid3x3, Settings, Truck, Star } from 'lucide-react'

const ProductDetail = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { id } = useParams()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [reviewDeleteModal, setReviewDeleteModal] = useState({ open: false, review: null })
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    active: true,
    category_id: '',
    category_ids: [],
    sub_category_ids: [],
    delivery_rate_per_km: '',
    bonus_points: '',
    shipping_type: 'bulk',
    weight_kg: '',
    weight_class: 'medium',
    shipping_category: '',
    search_keywords: [],
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
  const reviews = attrs.reviews || []
  const reviewSummary = attrs.review_summary || {}
  const shippingTypeOptions = [
    { value: 'bulk', label: 'Bulk / non-fragile' },
    { value: 'high_value', label: 'High-value / fragile' },
  ]
  const weightClassOptions = [
    { value: 'light', label: 'Light (about 0.3kg)' },
    { value: 'medium', label: 'Medium (about 1kg)' },
    { value: 'heavy', label: 'Heavy (about 3kg)' },
  ]

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories,
  })

  const { data: subCategoriesData } = useQuery({
    queryKey: ['sub_categories'],
    queryFn: () => categoryService.getAllSubCategories(),
  })

  const categoryOptions = (categoriesData?.data || []).map((category) => ({
    value: category.id,
    label: category.name || category.id,
  }))

  const selectedCategoryIds = useMemo(
    () => editFormData.category_ids || [],
    [editFormData.category_ids]
  )
  const selectedSubCategoryIds = useMemo(
    () => editFormData.sub_category_ids || [],
    [editFormData.sub_category_ids]
  )

  const subCategoryOptions = useMemo(() => {
    const selected = new Set(selectedCategoryIds)

    return (subCategoriesData?.data || [])
      .filter((subCategory) => selected.has(subCategory.category_id))
      .map((subCategory) => ({
        value: subCategory.id,
        label: `${subCategory.name} (${subCategory.category?.name || 'Category'})`,
      }))
  }, [selectedCategoryIds, subCategoriesData])


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

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => productService.deleteReview(id, reviewId),
    onSuccess: () => {
      toast.success('Review Deleted', 'Review has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setReviewDeleteModal({ open: false, review: null })
    },
    onError: (error) => {
      toast.error('Delete Failed', error.response?.data?.error || 'Failed to delete review')
    },
  })


  const handleDelete = () => {
    if (product) {
      deleteMutation.mutate(product.id)
    }
  }

  const handleDeleteReview = () => {
    if (reviewDeleteModal.review?.id) {
      deleteReviewMutation.mutate(reviewDeleteModal.review.id)
    }
  }

  const handleStartEdit = () => {
    setEditFormData({
      name: attrs.name || '',
      description: attrs.description || '',
      active: attrs.active !== false,
      category_id: attrs.category_id || attrs.category?.id || '',
      category_ids: attrs.category_ids || attrs.categories?.map((category) => category.id) || [],
      sub_category_ids: attrs.sub_category_ids || attrs.sub_categories?.map((subCategory) => subCategory.id) || [],
      delivery_rate_per_km: attrs.delivery_rate_per_km || '',
      bonus_points: attrs.bonus_points ?? '',
      shipping_type: attrs.shipping_type || 'bulk',
      weight_kg: attrs.weight_kg ?? '',
      weight_class: attrs.weight_class || 'medium',
      shipping_category: attrs.shipping_category || '',
      search_keywords: attrs.search_keywords || [],
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
      category_ids: attrs.category_ids || attrs.categories?.map((category) => category.id) || [],
      sub_category_ids: attrs.sub_category_ids || attrs.sub_categories?.map((subCategory) => subCategory.id) || [],
      delivery_rate_per_km: attrs.delivery_rate_per_km || '',
      bonus_points: attrs.bonus_points ?? '',
      shipping_type: attrs.shipping_type || 'bulk',
      weight_kg: attrs.weight_kg ?? '',
      weight_class: attrs.weight_class || 'medium',
      shipping_category: attrs.shipping_category || '',
      search_keywords: attrs.search_keywords || [],
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
      category_id: editFormData.category_ids?.[0] || editFormData.category_id || null,
      category_ids: editFormData.category_ids || [],
      sub_category_ids: editFormData.sub_category_ids || [],
      delivery_rate_per_km: editFormData.delivery_rate_per_km || null,
      bonus_points: Number(editFormData.bonus_points || 0),
      shipping_type: editFormData.shipping_type || 'bulk',
      weight_kg: editFormData.weight_kg || null,
      weight_class: editFormData.weight_class || null,
      shipping_category: editFormData.shipping_category || null,
      search_keywords: editFormData.search_keywords || [],
    })
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditKeywordsChange = (e) => {
    setEditFormData(prev => ({
      ...prev,
      search_keywords: e.target.value
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean)
    }))
  }

  const handleActiveToggle = (value) => {
    setEditFormData(prev => ({
      ...prev,
      active: value
    }))
  }

  const toggleArrayValue = (name, value) => {
    setEditFormData((prev) => {
      const currentValues = prev[name] || []
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]

      if (name !== 'category_ids') {
        return { ...prev, [name]: nextValues }
      }

      const selectedCategories = new Set(nextValues)
      const allowedSubCategoryIds = (subCategoriesData?.data || [])
        .filter((subCategory) => selectedCategories.has(subCategory.category_id))
        .map((subCategory) => subCategory.id)

      return {
        ...prev,
        category_id: nextValues[0] || '',
        category_ids: nextValues,
        sub_category_ids: (prev.sub_category_ids || []).filter((id) => allowedSubCategoryIds.includes(id)),
      }
    })
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
                    <MultiChoice
                      label="Categories"
                      options={categoryOptions}
                      selectedValues={selectedCategoryIds}
                      onToggle={(value) => toggleArrayValue('category_ids', value)}
                      emptyText="No categories found"
                    />
                    <MultiChoice
                      label="Subcategories"
                      options={subCategoryOptions}
                      selectedValues={selectedSubCategoryIds}
                      onToggle={(value) => toggleArrayValue('sub_category_ids', value)}
                      emptyText={selectedCategoryIds.length === 0 ? 'Select categories first' : 'No subcategories found'}
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
                    <Input
                      label="Bonus Points"
                      name="bonus_points"
                      type="number"
                      step="1"
                      min="0"
                      value={editFormData.bonus_points || ''}
                      onChange={handleEditFormChange}
                      placeholder="0"
                      inputClassName=" py-[5px]! text-sm rounded-lg!"
                    />
                    <Select
                      label="Shipping Type"
                      name="shipping_type"
                      value={editFormData.shipping_type || 'bulk'}
                      onChange={handleEditFormChange}
                      options={shippingTypeOptions}
                      placeholder="Select shipping type"
                      selectClassName="py-[6px]! text-sm rounded-lg!"
                    />
                    {(editFormData.shipping_type || 'bulk') === 'bulk' ? (
                      <>
                        <Select
                          label="Weight Class"
                          name="weight_class"
                          value={editFormData.weight_class || 'medium'}
                          onChange={handleEditFormChange}
                          options={weightClassOptions}
                          placeholder="Select weight class"
                          selectClassName="py-[6px]! text-sm rounded-lg!"
                        />
                        <Input
                          label="Exact Weight (kg)"
                          name="weight_kg"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editFormData.weight_kg || ''}
                          onChange={handleEditFormChange}
                          placeholder="Optional"
                          inputClassName=" py-[5px]! text-sm rounded-lg!"
                        />
                      </>
                    ) : (
                      <Input
                        label="Shipping Category"
                        name="shipping_category"
                        value={editFormData.shipping_category || ''}
                        onChange={handleEditFormChange}
                        placeholder="phone, laptop, electronics"
                        inputClassName=" py-[5px]! text-sm rounded-lg!"
                      />
                    )}
                    <div className="md:col-span-2">
                      <Textarea
                        label="Hidden Search Keywords"
                        name="search_keywords"
                        value={Array.isArray(editFormData.search_keywords) ? editFormData.search_keywords.join(', ') : editFormData.search_keywords || ''}
                        onChange={handleEditKeywordsChange}
                        placeholder="phone, iphone, electronic phone, cell phone, caller"
                        rows={3}
                      />
                    </div>
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
                    <dt className="text-sm font-light text-gray-500 mb-1">Categories</dt>
                    <dd className="text-sm text-gray-900 font-light">
                      {(attrs.categories || []).length > 0
                        ? attrs.categories.map((category) => category.name).join(', ')
                        : attrs.category?.name || '—'}
                    </dd>
                    {(attrs.sub_categories || []).length > 0 && (
                      <dd className="text-xs text-gray-500 mt-2">
                        Subcategories: {attrs.sub_categories.map((subCategory) => subCategory.name).join(', ')}
                      </dd>
                    )}
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
                        {attrs.bookable_type ? attrs.bookable_type.replace('_', ' ') : '—'}
                      </Badge>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                    <Star className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <dt className="text-sm font-light text-gray-500 mb-1">Bonus Points</dt>
                    <dd className="text-sm text-gray-900 font-light">
                      #{Number(attrs.bonus_points || 0).toLocaleString()}
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
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                    <Tag className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <dt className="text-sm font-light text-gray-500 mb-1">Cart / Wishlist</dt>
                    <dd className="text-sm text-gray-900 font-light">
                      {attrs.cart_count || 0} in cart
                    </dd>
                    <dd className="text-xs text-gray-500 mt-1">
                      {attrs.wishlist_count || 0} wishlisted
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
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                    <Truck className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <dt className="text-sm font-light text-gray-500 mb-1">Shipping</dt>
                    <dd className="text-sm text-gray-900 font-light">
                      {attrs.shipping_type === 'high_value'
                        ? `High-value (${attrs.shipping_category || 'category pending'})`
                        : `Bulk (${attrs.weight_kg ? `${attrs.weight_kg}kg` : attrs.weight_class || 'medium'})`}
                    </dd>
                  </div>
                </div>
                {(attrs.search_keywords || []).length > 0 && (
                  <div className="md:col-span-2 flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
                      <Tag className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <dt className="text-sm font-light text-gray-500 mb-1">Hidden Search Keywords</dt>
                      <dd className="text-sm text-gray-900 font-light">
                        {attrs.search_keywords.join(', ')}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            )}
            </div>
           <ProductImagesSection productId={id} images={attrs.images || []} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Star className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base font-semibold text-gray-900">Reviews</h2>
                  <p className="text-sm text-gray-500">
                    {reviewSummary.total_reviews || 0} total reviews
                  </p>
                </div>
              </div>
              <Badge variant={Number(reviewSummary.average_points) > 0 ? 'success' : 'still'}>
                {Number(reviewSummary.average_points || 0).toFixed(1)} / 5
              </Badge>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg border-gray-200">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const user = review.user || {}
                    const displayName =
                      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                      user.email ||
                      'Customer'

                    return (
                      <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{displayName}</p>
                            <p className="text-xs text-gray-500">
                              {review.created_at ? new Date(review.created_at).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              {review.points} / 5
                            </div>
                            <button
                              onClick={() => setReviewDeleteModal({ open: true, review })}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete review"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-700 mt-3 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
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
        <ConfirmModal
          open={reviewDeleteModal.open}
          onClose={() => setReviewDeleteModal({ open: false, review: null })}
          onConfirm={handleDeleteReview}
          title="Delete Review"
          description="Are you sure you want to delete this review? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
          isLoading={deleteReviewMutation.isPending}
        />
      </div>
    </div>
  )
}

const MultiChoice = ({ label, options, selectedValues, onToggle, emptyText }) => (
  <div>
    <div className="block text-sm font-medium mb-2 text-gray-700">{label}</div>
    <div className="border border-gray-200 rounded-lg p-3 min-h-12">
      {options.length === 0 ? (
        <div className="text-sm text-gray-500">{emptyText}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => onToggle(option.value)}
                className="h-4 w-4 accent-primary"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  </div>
)

export default ProductDetail
