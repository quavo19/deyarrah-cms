import { useState, useMemo, useCallback } from 'react'
import { useToast } from '@/hooks/useToast'
import CenterModal from '@/components/ui/CenterModal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'

const BulkStockModal = ({
  open,
  onClose,
  warehouseOptions,
  allCombinations,
  existingStocks,
  isLoading,
  onCreate,
  isCreating
}) => {
  const toast = useToast()
  const [selectedWarehouses, setSelectedWarehouses] = useState([])
  const [quantities, setQuantities] = useState({})

  const normalizeWarehouseId = (id) => String(id)

  const getComboKey = (optionIds) => {
    if (!optionIds || optionIds.length === 0) return '[]'
    // Handle both string and numeric IDs by converting to strings for consistent sorting
    return JSON.stringify([...optionIds].map(id => String(id)).sort((a, b) => {
      // Try numeric comparison first, fall back to string comparison
      const numA = Number(a)
      const numB = Number(b)
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      return a.localeCompare(b)
    }))
  }

  const formatOptionsDisplay = (options) => {
    if (!options || options.length === 0) {
      return 'Unit Product'
    }
    return options.map(opt => {
      if (typeof opt === 'object' && opt.name) {
        const variantType = opt.variant_type_name
        return variantType ? `${variantType}: ${opt.name}` : opt.name
      }
      return opt
    }).join(', ')
  }

  const existingStockMap = useMemo(() => {
    const map = new Set()
    existingStocks.forEach(stock => {
      const optionIds = stock?.option_ids || []
      if (optionIds.length === 0) return // Skip stocks without option IDs
      const comboKey = getComboKey(optionIds)
      const warehouseId = normalizeWarehouseId(stock?.warehouse_id)
      map.add(`${comboKey}_${warehouseId}`)
    })
    return map
  }, [existingStocks])

  const getWarehousesNeedingStock = useCallback((combo) => {
    const comboKey = getComboKey(combo.option_ids)
    return selectedWarehouses.filter(warehouseId => {
      const normalizedWarehouseId = normalizeWarehouseId(warehouseId)
      const stockKey = `${comboKey}_${normalizedWarehouseId}`
      return !existingStockMap.has(stockKey)
    })
  }, [selectedWarehouses, existingStockMap])

  const availableCombinations = useMemo(() => {
    if (selectedWarehouses.length === 0 || allCombinations.length === 0) return []

    return allCombinations.filter(combo => {
      const comboKey = getComboKey(combo.option_ids)
      return selectedWarehouses.some(warehouseId => {
        const normalizedWarehouseId = normalizeWarehouseId(warehouseId)
        const stockKey = `${comboKey}_${normalizedWarehouseId}`
        return !existingStockMap.has(stockKey)
      })
    })
  }, [allCombinations, existingStockMap, selectedWarehouses])

  const handleClose = () => {
    setSelectedWarehouses([])
    setQuantities({})
    onClose()
  }

  const handleWarehouseToggle = (warehouseId) => {
    setSelectedWarehouses(prev => {
      const isDeselecting = prev.includes(warehouseId)
      const newSelected = isDeselecting
        ? prev.filter(id => id !== warehouseId)
        : [...prev, warehouseId]

      if (isDeselecting && newSelected.length === 0) {
        setQuantities({})
      } else if (isDeselecting) {
        const normalizedWarehouseId = normalizeWarehouseId(warehouseId)
        setQuantities(prevQuantities => {
          const cleaned = {}
          Object.keys(prevQuantities).forEach(key => {
            const lastUnderscoreIndex = key.lastIndexOf('_')
            if (lastUnderscoreIndex === -1) return
            const warehouseIdStr = key.substring(lastUnderscoreIndex + 1)
            if (warehouseIdStr !== normalizedWarehouseId) {
              cleaned[key] = prevQuantities[key]
            }
          })
          return cleaned
        })
      }

      return newSelected
    })
  }

  const handleSelectAllWarehouses = () => {
    if (selectedWarehouses.length === warehouseOptions.length) {
      setSelectedWarehouses([])
      setQuantities({})
    } else {
      setSelectedWarehouses(warehouseOptions.map(w => w.value))
    }
  }

  const handleCreate = () => {
    if (selectedWarehouses.length === 0) {
      toast.error('Validation Error', 'Please select at least one warehouse')
      return
    }

    const stocksToCreate = []
    
    availableCombinations.forEach(combo => {
      const sortedOptionIds = [...combo.option_ids].sort((a, b) => a - b)
      const comboKey = getComboKey(sortedOptionIds)
      const warehousesNeedingStock = getWarehousesNeedingStock(combo)
      
      warehousesNeedingStock.forEach(warehouseId => {
        const normalizedWarehouseId = normalizeWarehouseId(warehouseId)
        const quantityKey = `${comboKey}_${normalizedWarehouseId}`
        const quantity = quantities[quantityKey]
        if (quantity !== undefined && quantity !== '' && parseInt(quantity) >= 0) {
          stocksToCreate.push({
            warehouse_id: warehouseId,
            option_ids: sortedOptionIds,
            quantity: parseInt(quantity),
          })
        }
      })
    })

    if (stocksToCreate.length === 0) {
      toast.error('Validation Error', 'Please enter quantities for at least one combination and warehouse')
      return
    }

    onCreate(stocksToCreate)
  }

  const validCount = useMemo(() => {
    let count = 0
    availableCombinations.forEach(combo => {
      const sortedOptionIds = [...combo.option_ids].sort((a, b) => a - b)
      const comboKey = getComboKey(sortedOptionIds)
      const warehousesNeedingStock = getWarehousesNeedingStock(combo)
      
      warehousesNeedingStock.forEach(warehouseId => {
        const normalizedWarehouseId = normalizeWarehouseId(warehouseId)
        const quantityKey = `${comboKey}_${normalizedWarehouseId}`
        const quantity = quantities[quantityKey]
        if (quantity !== undefined && quantity !== '' && parseInt(quantity) >= 0) {
          count++
        }
      })
    })
    return count
  }, [availableCombinations, quantities, getWarehousesNeedingStock])

  return (
    <CenterModal
      open={open}
      onClose={handleClose}
      heading="Add Stock for Variant Combinations"
      description="Enter quantities for missing variant combinations"
      className="max-w-4xl max-h-[90vh]"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading variants...</div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Select Warehouses
                </label>
                {warehouseOptions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllWarehouses}
                    className="text-xs text-primary! hover:text-primary-dark! cursor-pointer!"
                  >
                    {selectedWarehouses.length === warehouseOptions.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              {warehouseOptions.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No warehouses available. Please create at least one warehouse first.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {warehouseOptions.map(warehouse => (
                    <label
                      key={warehouse.value}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedWarehouses.includes(warehouse.value)}
                        onChange={() => handleWarehouseToggle(warehouse.value)}
                      />
                      <span className="text-sm text-gray-700">{warehouse.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {selectedWarehouses.length === 0 && warehouseOptions.length > 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Please select at least one warehouse to add stock.
              </div>
            )}

            {selectedWarehouses.length > 0 && availableCombinations.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                All variant combinations already have stock entries for the selected warehouses.
              </div>
            )}
            {selectedWarehouses.length > 0 && availableCombinations.length > 0 && (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {availableCombinations.map((combo) => {
                  const comboKey = getComboKey(combo.option_ids)
                  const warehousesNeedingStock = getWarehousesNeedingStock(combo)
                  return (
                    <div key={comboKey} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {formatOptionsDisplay(combo.options)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {warehousesNeedingStock.map(warehouseId => {
                          const warehouse = warehouseOptions.find(w => w.value === warehouseId)
                          const normalizedWarehouseId = normalizeWarehouseId(warehouseId)
                          const quantityKey = `${comboKey}_${normalizedWarehouseId}`
                          return (
                            <div key={warehouseId} className="space-y-1">
                              <label className="text-xs font-medium text-gray-600">
                                {warehouse?.label || warehouseId}
                              </label>
                              <Input
                                type="number"
                                min="0"
                                value={quantities[quantityKey] || ''}
                                onChange={(e) => {
                                  setQuantities(prev => ({
                                    ...prev,
                                    [quantityKey]: e.target.value
                                  }))
                                }}
                                placeholder="0"
                                className="text-sm"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={handleClose}
                className="bg-gray-200! text-gray-700! hover:bg-gray-300!"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || selectedWarehouses.length === 0}
                className="bg-green-600! text-white! hover:bg-green-700!"
              >
                {isCreating ? 'Creating...' : `Create ${validCount} Stock(s)`}
              </Button>
            </div>
          </>
        )}
      </div>
    </CenterModal>
  )
}

export default BulkStockModal
