import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Plus, Trash2 } from 'lucide-react'

const ProductMetaStep = ({ formData, errors, onChange }) => {
  const [metaFields, setMetaFields] = useState(
    formData.product_meta && formData.product_meta.length > 0
      ? formData.product_meta
      : [{ name: '', value: '' }]
  )

  const handleMetaChange = (index, field, value) => {
    const updated = [...metaFields]
    updated[index] = { ...updated[index], [field]: value }
    setMetaFields(updated)
    
    // Update parent form data
    const filtered = updated.filter(m => m.name.trim() !== '' || m.value.trim() !== '')
    onChange({
      target: {
        name: 'product_meta',
        value: filtered
      }
    })
  }

  const addMetaField = () => {
    setMetaFields([...metaFields, { name: '', value: '' }])
  }

  const removeMetaField = (index) => {
    if (metaFields.length > 1) {
      const updated = metaFields.filter((_, i) => i !== index)
      setMetaFields(updated)
      
      const filtered = updated.filter(m => m.name.trim() !== '' || m.value.trim() !== '')
      onChange({
        target: {
          name: 'product_meta',
          value: filtered
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Product Metadata</h2>
        <p className="text-gray-600 text-sm">
          Add additional metadata about your product (optional)
        </p>
      </div>

      <div className="space-y-4">
        {metaFields.map((meta, index) => (
          <div key={index} className="flex gap-4 items-start">
            <div className="flex-1">
              <Input
                label="Meta Name"
                value={meta.name}
                onChange={(e) => handleMetaChange(index, 'name', e.target.value)}
                placeholder="e.g., Material, Brand, Weight"
                error={errors[`meta_${index}_name`]}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Meta Value"
                value={meta.value}
                onChange={(e) => handleMetaChange(index, 'value', e.target.value)}
                placeholder="e.g., 100% Cotton"
                error={errors[`meta_${index}_value`]}
              />
            </div>
            <div className="pt-7">
              <button
                type="button"
                onClick={() => removeMetaField(index)}
                disabled={metaFields.length === 1}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={addMetaField}
        className="w-auto bg-gray-100 text-gray-700 hover:bg-gray-200"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Metadata Field
      </Button>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <strong>Examples:</strong> Material: "100% Cotton", Brand: "Premium", Weight: "200g"
        </p>
      </div>
    </div>
  )
}

export default ProductMetaStep
