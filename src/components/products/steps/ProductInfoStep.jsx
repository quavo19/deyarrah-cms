import { useQuery } from '@tanstack/react-query'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import { categoryService } from '@/services/category.service'

const ProductInfoStep = ({ formData, errors, onChange }) => {
  const bookableTypeOptions = [
    { value: 'bulk', label: 'Bulk (with variants)' },
    { value: 'unit', label: 'Unit (no variants)' },
  ]

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories,
  })

  const categoryOptions = categoriesData?.data
    ? [
        { value: '', label: 'Select a category' },
        ...categoriesData.data.map((category) => ({
          value: category.id,
          label: category?.name || category?.id,
        })),
      ]
    : [{ value: '', label: 'Loading categories...' }]

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
            label="Bookable Type"
            name="bookable_type"
            value={formData.bookable_type || ''}
            onChange={onChange}
            options={bookableTypeOptions}
            error={errors.bookable_type}
            required
            placeholder="Select bookable type"
          />
        </div>

        <div>
          <Select
            label="Category"
            name="category_id"
            value={formData.category_id || ''}
            onChange={onChange}
            options={categoryOptions}
            error={errors.category_id}
            required
            placeholder="Select a category"
            disabled={isLoadingCategories}
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
