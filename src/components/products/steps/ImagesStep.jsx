import { useState, useMemo, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react'

const ImagesStep = ({ formData, errors, onChange }) => {
  const [images, setImages] = useState(
    formData.images && formData.images.length > 0
      ? formData.images
      : [{ url: '', owner_type: 'Product', owner_id: '', file: null }]
  )

  // Get owner type options based on bookable_type
  const ownerTypeOptions = useMemo(() => {
    if (formData.bookable_type === 'unit') {
      return [{ value: 'Product', label: 'Product' }]
    } else if (formData.bookable_type === 'bulk') {
      return [
        { value: 'Product', label: 'Product' },
        { value: 'VariantOption', label: 'Variant Option' },
      ]
    }
    return [{ value: 'Product', label: 'Product' }]
  }, [formData.bookable_type])

  // Get all variant options for selection
  const variantOptions = useMemo(() => {
    if (!formData.variant_types || formData.variant_types.length === 0) {
      return []
    }

    const options = []
    formData.variant_types.forEach((variantType, vIndex) => {
      if (variantType.options && variantType.options.length > 0) {
        variantType.options.forEach((option, oIndex) => {
          if (option.name) {
            options.push({
              value: `${vIndex}-${oIndex}`,
              label: `${variantType.name}: ${option.name}`,
              variantIndex: vIndex,
              optionIndex: oIndex
            })
          }
        })
      }
    })
    return options
  }, [formData.variant_types])

  // Reset owner_type to Product if bookable_type is unit and current is VariantOption
  useEffect(() => {
    if (formData.bookable_type === 'unit') {
      const hasVariantOption = images.some(img => img.owner_type === 'VariantOption')
      if (hasVariantOption) {
        const updated = images.map(img => {
          if (img.owner_type === 'VariantOption') {
            return { ...img, owner_type: 'Product', owner_id: '' }
          }
          return img
        })
        setImages(updated)
        onChange({
          target: {
            name: 'images',
            value: updated.filter(img => img.url?.trim() || img.file)
          }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.bookable_type])

  const handleImageChange = (index, field, value) => {
    const updated = [...images]
    updated[index] = { ...updated[index], [field]: value }
    
    // If owner_type changes to Product, clear owner_id
    if (field === 'owner_type' && value === 'Product') {
      updated[index].owner_id = ''
    }
    
    setImages(updated)
    onChange({
      target: {
        name: 'images',
        value: updated.filter(img => img.url?.trim() || img.file)
      }
    })
  }

  const handleFileSelect = (index, file) => {
    if (!file) return

    // Store file object and create preview URL
    const previewUrl = URL.createObjectURL(file)
    const updated = [...images]
    updated[index] = {
      ...updated[index],
      file: file,
      url: previewUrl, // Temporary preview URL
      filePreview: previewUrl
    }
    setImages(updated)
    onChange({
      target: {
        name: 'images',
        value: updated.filter(img => img.url?.trim() || img.file)
      }
    })
  }

  const addImage = () => {
    setImages([...images, { url: '', owner_type: 'Product', owner_id: '', file: null }])
  }

  const removeImage = (index) => {
    if (images.length > 1) {
      // Clean up preview URL if exists
      if (images[index].filePreview) {
        URL.revokeObjectURL(images[index].filePreview)
      }
      const updated = images.filter((_, i) => i !== index)
      setImages(updated)
      onChange({
        target: {
          name: 'images',
          value: updated.filter(img => img.url?.trim() || img.file)
        }
      })
    } else {
      // Keep at least one empty field
      if (images[0].filePreview) {
        URL.revokeObjectURL(images[0].filePreview)
      }
      setImages([{ url: '', owner_type: 'Product', owner_id: '', file: null }])
      onChange({
        target: {
          name: 'images',
          value: []
        }
      })
    }
  }


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Product Images</h2>
        <p className="text-gray-600 text-sm">
          Add images for your product or variant options (optional)
        </p>
      </div>

      <div className="space-y-4">
        {images.map((image, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Image {index + 1}
              </h3>
              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={images.length === 1 && !image.url && !image.file}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Owner Type Selection */}
              <div>
                <Select
                  label="Attach To"
                  value={image.owner_type || 'Product'}
                  onChange={(e) => handleImageChange(index, 'owner_type', e.target.value)}
                  options={ownerTypeOptions}
                  required
                />
              </div>

              {/* Owner ID Selection (for VariantOption) */}
              {image.owner_type === 'VariantOption' && (
                <div>
                  <Select
                    label="Variant Option"
                    value={image.owner_id || ''}
                    onChange={(e) => handleImageChange(index, 'owner_id', e.target.value)}
                    options={variantOptions}
                    required
                    placeholder="Select variant option"
                    error={errors[`image_${index}_owner_id`]}
                  />
                  {variantOptions.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      No variant options available. Please add variants in the previous step.
                    </p>
                  )}
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) handleFileSelect(index, file)
                    }}
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">
                      {image.file ? image.file.name : 'Choose File'}
                    </span>
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Images will be uploaded to Cloudinary when you submit the form
                </p>
              </div>

              {/* URL Input (alternative) */}
              <div>
                <Input
                  label="Or Enter Image URL"
                  value={image.url && !image.file ? image.url : ''}
                  onChange={(e) => {
                    if (!image.file) {
                      handleImageChange(index, 'url', e.target.value)
                    }
                  }}
                  placeholder="https://image-url.local/image.jpg"
                  error={errors[`image_${index}_url`]}
                  disabled={!!image.file}
                />
                {image.file && (
                  <p className="text-xs text-gray-500 mt-1">
                    File selected. Clear file to enter URL instead.
                  </p>
                )}
              </div>

              {/* Preview */}
              {(image.url || image.filePreview) && (
                <div className="mt-4">
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={image.filePreview || image.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        const errorDiv = e.target.nextElementSibling
                        if (errorDiv) errorDiv.style.display = 'flex'
                      }}
                    />
                    <div className="hidden absolute inset-0 items-center justify-center text-gray-400">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Invalid image</p>
                      </div>
                    </div>
                  </div>
                  {image.file && (
                    <p className="text-xs text-gray-500 mt-2">
                      File: {image.file.name} ({(image.file.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={addImage}
        className="w-auto bg-gray-100 text-gray-700 hover:bg-gray-200"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Image
      </Button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong>{' '}
          {formData.bookable_type === 'bulk'
            ? 'You can attach images to the product or specific variant options. '
            : 'You can attach images to the product. '}
          Images will be uploaded to Cloudinary when you submit the form.
        </p>
      </div>
    </div>
  )
}

export default ImagesStep
