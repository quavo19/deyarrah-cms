import { useState, useMemo, useEffect, useRef } from 'react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { Plus, Trash2, X } from 'lucide-react'

const VariantsStep = ({ formData, errors, onChange }) => {
  const prevBookableTypeRef = useRef(formData.bookable_type)
  const initialVariantTypes = useMemo(() => {
    if (formData.bookable_type !== 'bulk') {
      return []
    }
    if (formData.variant_types && formData.variant_types.length > 0) {
      return formData.variant_types.map(vt => ({
        ...vt,
        options: vt.options?.map(opt => ({
          ...opt,
          price: opt.price || opt.price === 0 ? opt.price : '0'
        })) || []
      }))
    }
    // Initialize with Base variant for bulk products
    return [{ 
      name: 'Base', 
      description: 'Base pricing for bulk product', 
      options: [{ name: 'Standard', description: 'Standard pricing option', price: '0' }] 
    }]
  }, [formData.bookable_type, formData.variant_types])

  const [variantTypes, setVariantTypes] = useState(initialVariantTypes)

  useEffect(() => {
    if (formData.bookable_type !== prevBookableTypeRef.current) {
      if (formData.bookable_type !== 'bulk') {
        queueMicrotask(() => {
          setVariantTypes([])
          onChange({
            target: {
              name: 'variant_types',
              value: []
            }
          })
        })
      } else {
        queueMicrotask(() => {
          setVariantTypes(initialVariantTypes)
        })
      }
      prevBookableTypeRef.current = formData.bookable_type
    }
  }, [formData.bookable_type, initialVariantTypes, onChange])

  // For unit products, show pre-filled Base variant with Standard option
  if (formData.bookable_type !== 'bulk') {
    const unitVariantType = {
      name: 'Base',
      description: 'Base pricing for unit product',
      options: [{
        name: 'Standard',
        description: 'Standard pricing option',
        price: formData.variant_types?.[0]?.options?.[0]?.price || '0'
      }]
    }

    const handleUnitPriceChange = (value) => {
      onChange({
        target: {
          name: 'variant_types',
          value: [{
            ...unitVariantType,
            options: [{
              ...unitVariantType.options[0],
              price: value || '0'
            }]
          }]
        }
      })
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Variants</h2>
          <p className="text-gray-600 text-sm">
            Unit products use a base variant with standard pricing
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Base Variant Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Input
                  label="Variant Type Name"
                  value={unitVariantType.name}
                  disabled
                  inputClassName="bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <Textarea
                  label="Description"
                  value={unitVariantType.description}
                  disabled
                  textareaClassName="bg-gray-100 cursor-not-allowed"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Options</h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      label="Option Name"
                      value={unitVariantType.options[0].name}
                      disabled
                      inputClassName="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Input
                      label="Description"
                      value={unitVariantType.options[0].description}
                      disabled
                      inputClassName="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Input
                      label="Price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitVariantType.options[0].price}
                      onChange={(e) => handleUnitPriceChange(e.target.value || '0')}
                      placeholder="0.00"
                      error={errors[`variant_0_option_0_price`]}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> For unit products, the Base variant type and Standard option are automatically created. You only need to set the price.
          </p>
        </div>
      </div>
    )
  }

  const handleVariantTypeChange = (index, field, value) => {
    const updated = [...variantTypes]
    updated[index] = { ...updated[index], [field]: value }
    setVariantTypes(updated)
    onChange({
      target: {
        name: 'variant_types',
        value: updated
      }
    })
  }

  const handleOptionChange = (variantIndex, optionIndex, field, value) => {
    const updated = [...variantTypes]
    if (!updated[variantIndex].options) {
      updated[variantIndex].options = []
    }
    updated[variantIndex].options[optionIndex] = {
      ...updated[variantIndex].options[optionIndex],
      [field]: value
    }
    setVariantTypes(updated)
    onChange({
      target: {
        name: 'variant_types',
        value: updated
      }
    })
  }

  const addVariantType = () => {
    setVariantTypes([
      ...variantTypes,
      { name: '', description: '', options: [{ name: '', description: '', price: '0' }] }
    ])
  }

  const removeVariantType = (index) => {
    if (variantTypes.length > 1) {
      const updated = variantTypes.filter((_, i) => i !== index)
      setVariantTypes(updated)
      onChange({
        target: {
          name: 'variant_types',
          value: updated
        }
      })
    }
  }

  const addOption = (variantIndex) => {
    const updated = [...variantTypes]
    if (!updated[variantIndex].options) {
      updated[variantIndex].options = []
    }
    updated[variantIndex].options.push({ name: '', description: '', price: '0' })
    setVariantTypes(updated)
    onChange({
      target: {
        name: 'variant_types',
        value: updated
      }
    })
  }

  const removeOption = (variantIndex, optionIndex) => {
    const updated = [...variantTypes]
    if (updated[variantIndex].options.length > 1) {
      updated[variantIndex].options = updated[variantIndex].options.filter(
        (_, i) => i !== optionIndex
      )
      setVariantTypes(updated)
      onChange({
        target: {
          name: 'variant_types',
          value: updated
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Product Variants</h2>
        <p className="text-gray-600 text-sm">
          Define variant types (e.g., Size, Color) and their options
        </p>
      </div>

      <div className="space-y-8">
        {variantTypes.map((variantType, vIndex) => {
          const isBaseVariant = vIndex === 0 && variantType.name === 'Base'
          return (
          <div key={vIndex} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isBaseVariant ? 'Base Variant Type' : `Variant Type ${vIndex + 1}`}
              </h3>
              <button
                type="button"
                onClick={() => removeVariantType(vIndex)}
                disabled={variantTypes.length === 1 || isBaseVariant}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Input
                  label="Variant Type Name"
                  value={variantType.name}
                  onChange={(e) => handleVariantTypeChange(vIndex, 'name', e.target.value)}
                  placeholder="e.g., Size, Color"
                  error={errors[`variant_${vIndex}_name`]}
                  required
                  disabled={isBaseVariant}
                  inputClassName={isBaseVariant ? "bg-gray-100 cursor-not-allowed" : ""}
                />
              </div>
              <div>
                <Textarea
                  label="Description"
                  value={variantType.description || ''}
                  onChange={(e) => handleVariantTypeChange(vIndex, 'description', e.target.value)}
                  placeholder="Brief description of this variant type"
                  rows={2}
                  disabled={isBaseVariant}
                  textareaClassName={isBaseVariant ? "bg-gray-100 cursor-not-allowed" : ""}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Options</h4>
                {!isBaseVariant && (
                  <Button
                    type="button"
                    onClick={() => addOption(vIndex)}
                    className="w-auto px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                )}
              </div>

              {variantType.options?.map((option, oIndex) => {
                const isBaseOption = isBaseVariant && oIndex === 0 && option.name === 'Standard'
                return (
                <div
                  key={oIndex}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">
                      Option {oIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeOption(vIndex, oIndex)}
                      disabled={variantType.options.length === 1 || isBaseOption}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Input
                        label="Option Name"
                        value={option.name}
                        onChange={(e) => handleOptionChange(vIndex, oIndex, 'name', e.target.value)}
                        placeholder="e.g., Small, Red"
                        error={errors[`variant_${vIndex}_option_${oIndex}_name`]}
                        required
                        disabled={isBaseOption}
                        inputClassName={isBaseOption ? "bg-gray-100 cursor-not-allowed" : ""}
                      />
                    </div>
                    <div>
                      <Input
                        label="Description"
                        value={option.description || ''}
                        onChange={(e) => handleOptionChange(vIndex, oIndex, 'description', e.target.value)}
                        placeholder="Optional description"
                        disabled={isBaseOption}
                        inputClassName={isBaseOption ? "bg-gray-100 cursor-not-allowed" : ""}
                      />
                    </div>
                    <div>
                      <Input
                        label={isBaseOption ? "Price" : "Price (optional)"}
                        type="number"
                        step="0.01"
                        min="0"
                        value={option.price || option.price === 0 ? option.price : '0'}
                        onChange={(e) => handleOptionChange(vIndex, oIndex, 'price', e.target.value || '0')}
                        placeholder="0.00"
                        error={errors[`variant_${vIndex}_option_${oIndex}_price`]}
                        required={isBaseOption}
                      />
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )})}
      </div>

      <Button
        type="button"
        onClick={addVariantType}
        className="w-auto bg-gray-100 text-gray-700 hover:bg-gray-200"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Variant Type
      </Button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Common variant types include Size (S, M, L, XL) and Color (Red, Blue, Green).
          You'll create stock combinations for each option combination in the next step.
        </p>
      </div>
    </div>
  )
}

export default VariantsStep
