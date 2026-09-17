import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import { categoryService } from '@/services/category.service'

const ProductInfoStep = ({ formData, errors, onChange }) => {
  const productTypeOptions = [
    { value: 'bulk', label: 'Bulk (with variants)' },
    { value: 'unit', label: 'Unit (no variants)' },
  ]
  const shippingTypeOptions = [
    { value: 'bulk', label: 'Bulk / non-fragile' },
    { value: 'high_value', label: 'High-value / fragile' },
  ]
  const weightClassOptions = [
    { value: 'light', label: 'Light (about 0.3kg)' },
    { value: 'medium', label: 'Medium (about 1kg)' },
    { value: 'heavy', label: 'Heavy (about 3kg)' },
  ]

  const searchKeywordsValue = Array.isArray(formData.search_keywords)
    ? formData.search_keywords.join(', ')
    : formData.search_keywords || ''

  const handleSearchKeywordsChange = (event) => {
    onChange({
      target: {
        name: 'search_keywords',
        value: event.target.value
          .split(',')
          .map((keyword) => keyword.trim())
          .filter(Boolean),
      },
    })
  }

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories,
  })

  const { data: subCategoriesData, isLoading: isLoadingSubCategories } = useQuery({
    queryKey: ['sub_categories'],
    queryFn: () => categoryService.getAllSubCategories(),
  })

  const categoryOptions = categoriesData?.data
    ? categoriesData.data.map((category) => ({
        value: category.id,
        label: category?.name || category?.id,
      }))
    : []

  const selectedCategoryIds = useMemo(
    () => formData.category_ids || (formData.category_id ? [formData.category_id] : []),
    [formData.category_id, formData.category_ids]
  )
  const selectedSubCategoryIds = useMemo(
    () => formData.sub_category_ids || [],
    [formData.sub_category_ids]
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

  const toggleArrayValue = (name, value) => {
    const currentValues = name === 'category_ids' ? selectedCategoryIds : selectedSubCategoryIds
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value]

    if (name === 'category_ids') {
      const selectedCategories = new Set(nextValues)
      const allowedSubCategoryIds = (subCategoriesData?.data || [])
        .filter((subCategory) => selectedCategories.has(subCategory.category_id))
        .map((subCategory) => subCategory.id)

      onChange({ target: { name: 'sub_category_ids', value: selectedSubCategoryIds.filter((id) => allowedSubCategoryIds.includes(id)) } })
      onChange({ target: { name: 'category_id', value: nextValues[0] || '' } })
    }

    onChange({ target: { name, value: nextValues } })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Product Information</h2>
        <p className="text-gray-600 text-sm">
          Enter the basic information about your product
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Product Name"
            name="name"
            value={formData.name || ''}
            onChange={onChange}
            error={errors.name}
            required
            placeholder="e.g., Premium Cotton Shirt"
          />
        </div>

        <div className="md:col-span-2">
          <Textarea
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={onChange}
            error={errors.description}
            required
            placeholder="Describe your product in detail..."
            rows={4}
          />
        </div>

        <div>
          <Select
            label="Product Type"
            name="bookable_type"
            value={formData.bookable_type || ''}
            onChange={onChange}
            options={productTypeOptions}
            error={errors.bookable_type}
            required
            placeholder="Select product type"
          />
        </div>

        <div className="md:col-span-2">
          <MultiChoice
            label="Categories"
            options={categoryOptions}
            selectedValues={selectedCategoryIds}
            onToggle={(value) => toggleArrayValue('category_ids', value)}
            error={errors.category_ids}
            isLoading={isLoadingCategories}
            emptyText="No categories found"
          />
        </div>

        <div className="md:col-span-2">
          <MultiChoice
            label="Subcategories"
            options={subCategoryOptions}
            selectedValues={selectedSubCategoryIds}
            onToggle={(value) => toggleArrayValue('sub_category_ids', value)}
            isLoading={isLoadingSubCategories}
            emptyText={selectedCategoryIds.length === 0 ? 'Select categories first' : 'No subcategories found'}
          />
        </div>

        <div>
          <Input
            label="Delivery Rate Per KM (GHS)"
            name="delivery_rate_per_km"
            type="number"
            step="0.01"
            min="0"
            value={formData.delivery_rate_per_km || ''}
            onChange={onChange}
            error={errors.delivery_rate_per_km}
            placeholder="0.00"
          />
        </div>

        <div>
          <Input
            label="Bonus Points"
            name="bonus_points"
            type="number"
            step="1"
            min="0"
            value={formData.bonus_points || ''}
            onChange={onChange}
            error={errors.bonus_points}
            placeholder="0"
          />
        </div>

        <div>
          <Select
            label="Shipping Type"
            name="shipping_type"
            value={formData.shipping_type || 'bulk'}
            onChange={onChange}
            options={shippingTypeOptions}
            error={errors.shipping_type}
            required
            placeholder="Select shipping type"
          />
        </div>

        {(formData.shipping_type || 'bulk') === 'bulk' ? (
          <>
            <div>
              <Select
                label="Weight Class"
                name="weight_class"
                value={formData.weight_class || 'medium'}
                onChange={onChange}
                options={weightClassOptions}
                error={errors.weight_class}
                placeholder="Select weight class"
              />
            </div>

            <div>
              <Input
                label="Exact Weight (kg)"
                name="weight_kg"
                type="number"
                step="0.01"
                min="0"
                value={formData.weight_kg || ''}
                onChange={onChange}
                error={errors.weight_kg}
                placeholder="Optional"
              />
            </div>
          </>
        ) : (
          <div>
            <Input
              label="Shipping Category"
              name="shipping_category"
              value={formData.shipping_category || ''}
              onChange={onChange}
              error={errors.shipping_category}
              required
              placeholder="phone, laptop, electronics"
            />
          </div>
        )}

        <div className="md:col-span-2">
          <Textarea
            label="Hidden Search Keywords"
            name="search_keywords"
            value={searchKeywordsValue}
            onChange={handleSearchKeywordsChange}
            error={errors.search_keywords}
            placeholder="phone, iphone, electronic phone, cell phone, caller"
            rows={3}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> If you select "Bulk", you'll be able to add variants (like Size, Color) in the next steps.
          If you select "Unit", the product will have no variants.
        </p>
      </div>
    </div>
  )
}

export default ProductInfoStep

const MultiChoice = ({ label, options, selectedValues, onToggle, error, isLoading, emptyText }) => (
  <div>
    <div className="block text-sm font-medium mb-2 text-gray-700">{label}</div>
    <div className={`border rounded-lg p-3 min-h-12 ${error ? 'border-red-500' : 'border-gray-200'}`}>
      {isLoading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : options.length === 0 ? (
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
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
)
