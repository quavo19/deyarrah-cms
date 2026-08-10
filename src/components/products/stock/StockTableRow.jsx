import { Settings, Trash2, Clock } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import OptionsDisplay from './OptionsDisplay'
import { getWarehouseName } from './stockUtils'

const StockTableRow = ({
  stock,
  bookableType,
  isEditing,
  editingStock,
  setEditingStock,
  warehouses,
  onUpdate,
  onDelete,
  onScheduleDowntime,
  isUpdating
}) => {
  const attrs = stock || {}
  const totalQty = Number(attrs?.quantity ?? 0)
  const availableQtyRaw = attrs?.available_quantity ?? attrs?.quantity ?? 0
  const availableQty = Number(availableQtyRaw)
  const safeTotalQty = Number.isFinite(totalQty) ? totalQty : 0
  const safeAvailableQty = Number.isFinite(availableQty) ? availableQty : 0
  const availablePct =
    safeTotalQty > 0 ? Math.max(0, Math.min(100, (safeAvailableQty / safeTotalQty) * 100)) : 0
  const isOutOfStock = safeTotalQty > 0 && safeAvailableQty <= 0
  const isLowStock = safeTotalQty > 0 && !isOutOfStock && safeAvailableQty / safeTotalQty <= 0.2

  return (
    <tr className="bg-white border border-gray-200">
      <td className="px-4 py-3">
        <span className="text-sm text-gray-900">{getWarehouseName(attrs.warehouse_id, warehouses)}</span>
      </td>
      {bookableType === 'bulk' && (
        <td className="px-4 py-4">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <OptionsDisplay options={attrs.options || []} />
              
            </div>
          ) : (
            <div className="min-w-[250px] max-w-md">
              <OptionsDisplay options={attrs.options || []} />
            </div>
          )}
        </td>
      )}
      <td className="px-4 py-3">
        {isEditing ? (
          <Input
            type="number"
            min="0"
            value={editingStock?.quantity !== undefined ? editingStock.quantity : attrs.quantity}
            onChange={(e) => setEditingStock({ ...editingStock, quantity: e.target.value })}
            className="text-sm w-24! rounded-none! py-[6px]!"
          />
        ) : (
          <div className="min-w-[160px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">Available</span>
              <div className="flex items-center gap-2">
                {(isOutOfStock || isLowStock) && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${
                      isOutOfStock
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                    }`}
                  >
                    {isOutOfStock ? 'Out' : 'Low'}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-900 tabular-nums">
                  {safeTotalQty > 0 ? `${safeAvailableQty} / ${safeTotalQty}` : '—'}
                </span>
              </div>
            </div>

            {safeTotalQty > 0 && (
              <div className="mt-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-yellow-500' : 'bg-green-600'
                  }`}
                  style={{ width: `${availablePct}%` }}
                />
              </div>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              onClick={onUpdate}
              disabled={isUpdating}
              className="rounded-none! bg-green-600! text-white! hover:bg-green-700! text-sm! px-3! py-1.5! cursor-pointer! "
            >
              Save
            </Button>
            <Button
              onClick={() => setEditingStock(null)}
              className="bg-gray-200! text-gray-700! hover:bg-gray-300! text-xs! rounded-none!"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingStock({
                id: stock.id,
                warehouse_id: attrs.warehouse_id,
                option_ids: attrs.option_ids || [],
                quantity: attrs.quantity,
              })}
              className="p-1 text-gray-400 hover:bg-gray-50 rounded"
              title="Edit"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => onScheduleDowntime(stock.id)}
              className="p-1 text-primary hover:text-primary-dark hover:bg-primary-light rounded"
              title="Schedule Downtime"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default StockTableRow
