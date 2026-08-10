import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const UnitStockForm = ({
  warehouseId,
  quantity,
  warehouseOptions,
  onWarehouseChange,
  onQuantityChange,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="space-y-3">
        <Select
          value={warehouseId}
          onChange={onWarehouseChange}
          options={[
            { value: '', label: 'Select warehouse' },
            ...warehouseOptions
          ]}
        />
        <Input
          label="Quantity"
          type="number"
          min="0"
          value={quantity}
          onChange={onQuantityChange}
          placeholder="0"
          required
        />
        <div className="flex gap-2">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            Create Stock
          </Button>
          <Button
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UnitStockForm
