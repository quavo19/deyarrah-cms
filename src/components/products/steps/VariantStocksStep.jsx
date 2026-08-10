import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import Input from '@/components/ui/Input'
import { warehouseService } from '@/services/warehouse.service'

const VariantStocksStep = ({ formData, errors, onChange }) => {
  const prevCombinationsKeyRef = useRef(null)
  const prevBookableTypeRef = useRef(formData.bookable_type)
  const isInitialMountRef = useRef(true)

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehouseService.getAllWarehouses,
  })

  const warehouses = useMemo(() => warehousesData?.data || [], [warehousesData?.data])

  const allCombinations = useMemo(() => {
    if (formData.bookable_type !== 'bulk' || !formData.variant_types || formData.variant_types.length === 0) {
      return []
    }

    const generateCombinations = (arrays, index = 0, current = []) => {
      if (index === arrays.length) {
        return [current]
      }

      const result = []
      for (const item of arrays[index]) {
        result.push(...generateCombinations(arrays, index + 1, [...current, item]))
      }
      return result
    }

    const variantOptions = formData.variant_types.map(vt =>
      (vt.options || []).map(opt => opt.name).filter(Boolean)
    )

    return generateCombinations(variantOptions)
  }, [formData.variant_types, formData.bookable_type])

  const combinationsKey = JSON.stringify(allCombinations)

  // Initialize stocks with all warehouses
  const initializeStocksWithWarehouses = useMemo(() => {
    if (warehouses.length === 0) return []
    
    if (formData.bookable_type === 'unit') {
      if (formData.variant_stocks && formData.variant_stocks.length > 0) {
        const existingStock = formData.variant_stocks[0]
        const existingMap = new Map(
          (existingStock.warehouse_stocks || []).map(ws => [ws.warehouse_id, ws.quantity])
        )
        return [{
          option_names: [],
          warehouse_stocks: warehouses.map(w => ({
            warehouse_id: w.id,
            quantity: existingMap.get(w.id) || '0'
          }))
        }]
      }
      return [{
        option_names: [],
        warehouse_stocks: warehouses.map(w => ({
          warehouse_id: w.id,
          quantity: '0'
        }))
      }]
    }

    if (formData.bookable_type === 'bulk' && allCombinations.length > 0) {
      if (formData.variant_stocks && formData.variant_stocks.length > 0) {
        const existingStocksMap = new Map()
        formData.variant_stocks.forEach(stock => {
          const key = JSON.stringify(stock.option_names || [])
          const warehouseMap = new Map(
            (stock.warehouse_stocks || []).map(ws => [ws.warehouse_id, ws.quantity])
          )
          existingStocksMap.set(key, warehouseMap)
        })

        return allCombinations.map(combination => {
          const key = JSON.stringify(combination)
          const existingMap = existingStocksMap.get(key) || new Map()
          return {
            option_names: combination,
            warehouse_stocks: warehouses.map(w => ({
              warehouse_id: w.id,
              quantity: existingMap.get(w.id) || ''
            }))
          }
        })
      }

      return allCombinations.map(combination => ({
        option_names: combination,
        warehouse_stocks: warehouses.map(w => ({
          warehouse_id: w.id,
          quantity: ''
        }))
      }))
    }

    return []
  }, [warehouses, formData.bookable_type, allCombinations, formData.variant_stocks])

  const [stocks, setStocks] = useState(initializeStocksWithWarehouses)

  // Update stocks when warehouses or combinations change
  useEffect(() => {
    if (warehouses.length === 0) return

    if (isInitialMountRef.current) {
      prevCombinationsKeyRef.current = combinationsKey
      prevBookableTypeRef.current = formData.bookable_type
      isInitialMountRef.current = false
      if (initializeStocksWithWarehouses.length > 0) {
        queueMicrotask(() => {
          setStocks(initializeStocksWithWarehouses)
          onChange({
            target: {
              name: 'variant_stocks',
              value: initializeStocksWithWarehouses
            }
          })
        })
      }
      return
    }

    const bookableTypeChanged = formData.bookable_type !== prevBookableTypeRef.current
    const combinationsChanged = combinationsKey !== prevCombinationsKeyRef.current

    if (bookableTypeChanged) {
      if (formData.bookable_type === 'unit') {
        const existingMap = new Map(
          (stocks[0]?.warehouse_stocks || []).map(ws => [ws.warehouse_id, ws.quantity])
        )
        const unitStock = [{
          option_names: [],
          warehouse_stocks: warehouses.map(w => ({
            warehouse_id: w.id,
            quantity: existingMap.get(w.id) || ''
          }))
        }]
        queueMicrotask(() => {
          setStocks(unitStock)
          onChange({
            target: {
              name: 'variant_stocks',
              value: unitStock
            }
          })
        })
      }
      prevBookableTypeRef.current = formData.bookable_type
      prevCombinationsKeyRef.current = combinationsKey
    } else if (combinationsChanged && formData.bookable_type === 'bulk' && allCombinations.length > 0) {
      const currentKeys = new Set(stocks.map(s => JSON.stringify(s.option_names || [])))
      const combinationKeys = new Set(allCombinations.map(c => JSON.stringify(c)))
      const keysMatch = currentKeys.size === combinationKeys.size &&
        [...currentKeys].every(key => combinationKeys.has(key))

      if (!keysMatch) {
        const warehouseStocksMap = new Map()
        stocks.forEach(stock => {
          const key = JSON.stringify(stock.option_names || [])
          const warehouseMap = new Map(
            (stock.warehouse_stocks || []).map(ws => [ws.warehouse_id, ws.quantity])
          )
          warehouseStocksMap.set(key, warehouseMap)
        })

        const newStocks = allCombinations.map(combination => {
          const key = JSON.stringify(combination)
          const existingMap = warehouseStocksMap.get(key) || new Map()
          return {
            option_names: combination,
            warehouse_stocks: warehouses.map(w => ({
              warehouse_id: w.id,
              quantity: existingMap.get(w.id) || ''
            }))
          }
        })

        queueMicrotask(() => {
          setStocks(newStocks)
          onChange({
            target: {
              name: 'variant_stocks',
              value: newStocks
            }
          })
        })
      }
      prevCombinationsKeyRef.current = combinationsKey
    } else if (warehouses.length > 0) {
      // Update stocks when warehouses are added/removed
      const updatedStocks = stocks.map(stock => {
        const existingMap = new Map(
          (stock.warehouse_stocks || []).map(ws => [ws.warehouse_id, ws.quantity])
        )
        return {
          ...stock,
          warehouse_stocks: warehouses.map(w => ({
            warehouse_id: w.id,
            quantity: existingMap.get(w.id) || ''
          }))
        }
      })
      
      if (JSON.stringify(updatedStocks) !== JSON.stringify(stocks)) {
        queueMicrotask(() => {
          setStocks(updatedStocks)
          onChange({
            target: {
              name: 'variant_stocks',
              value: updatedStocks
            }
          })
        })
      }
    }
  }, [combinationsKey, formData.bookable_type, allCombinations, warehouses, initializeStocksWithWarehouses, stocks, onChange])

  const handleQuantityChange = (stockIndex, warehouseId, value) => {
    const updated = [...stocks]
    const warehouseStock = updated[stockIndex].warehouse_stocks.find(
      ws => ws.warehouse_id === warehouseId
    )
    if (warehouseStock) {
      warehouseStock.quantity = value
    }
    setStocks(updated)
    onChange({
      target: {
        name: 'variant_stocks',
        value: updated
      }
    })
  }

  const getVariantBadges = (optionNames, variantTypes) => {
    if (!optionNames || optionNames.length === 0) {
      return []
    }

    return optionNames.map((optionName, index) => {
      const variantType = variantTypes[index]
      return {
        label: variantType ? variantType.name : 'Option',
        value: optionName
      }
    })
  }

  if (formData.bookable_type === 'bulk' && allCombinations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Inventory Stock</h2>
          <p className="text-gray-600 text-sm">
            Set stock quantities for each variant combination
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Notice:</strong> Please add variant types and options in the previous step to generate stock combinations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Inventory Stock</h2>
        <p className="text-gray-600 text-sm">
          {formData.bookable_type === 'bulk'
            ? `Set stock quantities for each of the ${allCombinations.length} variant combinations across warehouses`
            : 'Set the stock quantity for this unit product across warehouses'}
        </p>
      </div>

      {isLoadingWarehouses && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">Loading warehouses...</p>
        </div>
      )}

      {!isLoadingWarehouses && warehouses.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> No warehouses found. Please create at least one warehouse before adding inventory.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stocks.map((stock, stockIndex) => {
          const variantBadges = formData.bookable_type === 'bulk' 
            ? getVariantBadges(stock.option_names, formData.variant_types)
            : []
          
          return (
            <div key={stockIndex} className="border border-gray-200 rounded-xl p-4 bg-white min-w-sm transition-shadow">
              {/* Variant Header */}
              <div className="mb-4 pb-3 border-gray-200">
                {formData.bookable_type === 'bulk' ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {variantBadges.map((badge, badgeIndex) => (
                        <div key={badgeIndex} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md">
                          <span className="text-xs font-medium text-blue-700">{badge.label}</span>
                          <span className="text-xs text-blue-600">:</span>
                          <span className="text-xs font-semibold text-blue-900">{badge.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-gray-700">Unit Product</div>
                )}
              </div>

              {/* Warehouse Stocks */}
              <div className="space-y-3">
                {warehouses.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No warehouses available
                  </p>
                ) : (
                  stock.warehouse_stocks && stock.warehouse_stocks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stock.warehouse_stocks.map((warehouseStock, warehouseIndex) => {
                        const warehouse = warehouses.find(w => w.id === warehouseStock.warehouse_id)
                        const warehouseName = warehouse?.attributes?.name || warehouseStock.warehouse_id
                        
                        return (
                          <div key={warehouseStock.warehouse_id} className="flex gap-2 flex-col">
                            <label className="text-xs font-medium text-gray-600">
                              {warehouseName}
                            </label>
                            <Input
                              type="number"
                              min="0"
                              value={warehouseStock.quantity || ''}
                              onChange={(e) => handleQuantityChange(stockIndex, warehouseStock.warehouse_id, e.target.value)}
                              error={errors[`stock_${stockIndex}_warehouse_${warehouseIndex}_quantity`]}
                              placeholder="0" 
                              containerClassName="text-sm!"
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">
                      Loading warehouses...
                    </p>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong>{' '}
          {formData.bookable_type === 'bulk'
            ? `All ${allCombinations.length} possible variant combinations have been automatically generated. Add warehouses and set quantities for each combination. Each variant can have different quantities in different warehouses.`
            : 'For unit products, add warehouses and set quantities for each warehouse. The same product can have different quantities in different warehouses.'}
        </p>
      </div>
    </div>
  )
}

export default VariantStocksStep
