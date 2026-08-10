import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { productService } from '@/services/product.service'
import { warehouseService } from '@/services/warehouse.service'
import Button from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import Select from '@/components/ui/Select'
import { Plus, Package } from 'lucide-react'

import { useStockMutations } from './stock/useStockMutations'
import { useVariantCombinations } from './stock/useVariantCombinations'
import StockTableRow from './stock/StockTableRow'
import BulkStockModal from './stock/BulkStockModal'
import UnitStockForm from './stock/UnitStockForm'
import StockDowntimeModal from './stock/StockDowntimeModal'

const ProductVariantStocksSection = ({ productId, bookableType }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showCreateStock, setShowCreateStock] = useState(false)
  const [showBulkStockModal, setShowBulkStockModal] = useState(false)
  const [editingStock, setEditingStock] = useState(null)
  const [deleteStockModal, setDeleteStockModal] = useState(null)
  const [downtimeModalOpen, setDowntimeModalOpen] = useState(false)
  const [selectedStockId, setSelectedStockId] = useState(null)
  const [filterWarehouse, setFilterWarehouse] = useState('')
  const [newStock, setNewStock] = useState({
    warehouse_id: '',
    option_ids: [],
    quantity: '',
  })

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehouseService.getAllWarehouses,
  })

  const { data: stocksData, isLoading: isLoadingStocks } = useQuery({
    queryKey: ['variant-stocks', productId],
    queryFn: () => productService.getVariantStocks({ product_id: productId }),
    enabled: !!productId,
  })

  const { data: variantsData } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => productService.getProductVariants(productId),
    enabled: !!productId,
  })

  const { data: unitVariantOptionsData } = useQuery({
    queryKey: ['unit-variant-options', productId],
    queryFn: async () => {
      if (bookableType !== 'unit' || !variantsData?.data) return null
      const baseVariant = variantsData.data.find(v => 
        v?.name === 'Base' || v?.pricing_role === 'base'
      )
      if (!baseVariant) return null
      const options = await productService.getVariantOptions(baseVariant.id)
      const standardOption = options.data?.find(opt => 
        opt?.name === 'Standard'
      )
      return standardOption ? standardOption.id : null
    },
    enabled: !!productId && bookableType === 'unit' && !!variantsData?.data,
  })

  const warehouses = warehousesData?.data || []
  const allStocks = useMemo(() => stocksData?.meta?.available_combinations || [], [stocksData?.meta?.available_combinations])
  const variants = variantsData?.data || []
  const unitStandardOptionId = unitVariantOptionsData || null

  const stocks = useMemo(() => {
    if (!filterWarehouse) return allStocks
    return allStocks.filter(stock => {
      const warehouseId = stock?.warehouse_id
      return String(warehouseId) === String(filterWarehouse)
    })
  }, [allStocks, filterWarehouse])

  const {
    createStockMutation,
    createBulkStocksMutation,
    updateStockMutation,
    deleteStockMutation
  } = useStockMutations(productId)

  const { variantOptionsResults, allCombinations } = useVariantCombinations(
    productId,
    bookableType,
    variants
  )

  useEffect(() => {
    if (bookableType === 'bulk' && variants.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['variant-options-batch', productId] })
    }
  }, [variants.length, productId, bookableType, queryClient])
  const warehouseOptions = warehouses.map(w => ({
    value: w.id,
    label: w?.attributes?.name || w.id
  }))

  const handleCreateStock = () => {
    if (!newStock.warehouse_id) {
      toast.error('Validation Error', 'Warehouse is required')
      return
    }
    if (newStock.quantity === '' || parseInt(newStock.quantity) < 0) {
      toast.error('Validation Error', 'Valid quantity is required')
      return
    }

    let optionIds = []
    if (bookableType === 'bulk') {
      optionIds = newStock.option_ids || []
    } else if (bookableType === 'unit' && unitStandardOptionId) {
      optionIds = [unitStandardOptionId]
    }

    createStockMutation.mutate({
      warehouse_id: newStock.warehouse_id,
      option_ids: optionIds,
      quantity: parseInt(newStock.quantity),
    }, {
      onSuccess: () => {
        setShowCreateStock(false)
        setNewStock({ warehouse_id: '', option_ids: [], quantity: '' })
      }
    })
  }

  const handleUpdateStock = (stockId) => {
    if (!editingStock.warehouse_id) {
      toast.error('Validation Error', 'Warehouse is required')
      return
    }
    if (editingStock.quantity === '' || parseInt(editingStock.quantity) < 0) {
      toast.error('Validation Error', 'Valid quantity is required')
      return
    }

    let optionIds = []
    if (bookableType === 'bulk') {
      optionIds = editingStock.option_ids || []
    } else if (bookableType === 'unit' && unitStandardOptionId) {
      optionIds = [unitStandardOptionId]
    }

    updateStockMutation.mutate({
      stockId,
      data: {
        warehouse_id: editingStock.warehouse_id,
        option_ids: optionIds,
        quantity: parseInt(editingStock.quantity),
      }
    }, {
      onSuccess: () => {
        setEditingStock(null)
      }
    })
  }

  const handleBulkCreateStocks = (stocksToCreate) => {
    createBulkStocksMutation.mutate(stocksToCreate, {
      onSuccess: () => {
        setShowBulkStockModal(false)
      }
    })
  }

  const handleScheduleDowntime = (stockId) => {
    setSelectedStockId(stockId)
    setDowntimeModalOpen(true)
  }

  return (
    <div className="">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Package className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-semibold text-gray-900">Stock</h2>
              <p className="text-sm text-gray-500">
                Define stocks for the product
              </p>
          </div>
        </div>
        
      <div className="flex items-center gap-2">  {allStocks.length > 0 && (
        <div className="">
          <Select
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            options={[
              { value: '', label: 'All Warehouses' },
              ...warehouseOptions
            ]}
            selectClassName="text-sm! py-[6px]! rounded-none!"
            placeholder="All Warehouses"
          />
        </div>
      )}
        {bookableType === 'bulk' ? (
          <Button
            onClick={() => setShowBulkStockModal(true)}
            className="flex items-center gap-2 w-auto rounded-none! bg-green-600! text-white! hover:bg-green-700! text-sm! px-3! py-1.5! cursor-pointer! "
            disabled={isLoadingWarehouses || warehouses.length === 0 || variantOptionsResults.isLoading}
          >
            <Plus className="w-4 h-4" />
            Add Stock
          </Button>
        ) : (
          <Button
            onClick={() => setShowCreateStock(!showCreateStock)}
            className="flex items-center gap-2 w-auto rounded-none! bg-green-600! text-white! hover:bg-green-700! text-sm! px-3! py-1.5! cursor-pointer! "
            disabled={isLoadingWarehouses || warehouses.length === 0}
          >
            <Plus className="w-4 h-4" />
            {showCreateStock ? 'Cancel' : 'Add Stock'}
          </Button>
        )}</div>
      </div>

      

      {isLoadingWarehouses && warehouses.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> No warehouses found. Please create at least one warehouse before adding inventory.
          </p>
        </div>
      )}

      {bookableType !== 'bulk' && showCreateStock && (
        <UnitStockForm
          warehouseId={newStock.warehouse_id}
          quantity={newStock.quantity}
          warehouseOptions={warehouseOptions}
          onWarehouseChange={(e) => setNewStock({ ...newStock, warehouse_id: e.target.value })}
          onQuantityChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })}
          onSubmit={handleCreateStock}
          onCancel={() => {
            setShowCreateStock(false)
            setNewStock({ warehouse_id: '', option_ids: [], quantity: '' })
          }}
          isSubmitting={createStockMutation.isPending}
        />
      )}

      {isLoadingStocks ? (
        <div className="text-center py-8 text-gray-500">Loading stocks...</div>
      ) : (
        <>
          {stocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filterWarehouse 
                ? 'No stocks found for the selected warehouse.'
                : 'No variant stocks found. Add a stock entry to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                {bookableType === 'bulk' && (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
                )}
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stocks.map((stock) => (
                <StockTableRow
                  key={stock.id}
                  stock={stock}
                  bookableType={bookableType}
                  isEditing={editingStock?.id === stock?.id}
                  editingStock={editingStock}
                  setEditingStock={setEditingStock}
                  warehouseOptions={warehouseOptions}
                  warehouses={warehouses}
                  onUpdate={() => handleUpdateStock(stock.id)}
                  onDelete={() => setDeleteStockModal(stock)}
                  onScheduleDowntime={handleScheduleDowntime}
                  isUpdating={updateStockMutation.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
          )}
        </>
      )}

      {bookableType === 'bulk' && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> When you add or modify variants/options, you may need to regenerate variant stocks.
            New combinations will need to be created manually. Existing stocks will be preserved unless you delete them.
          </p>
        </div>
      )}

      <BulkStockModal
        open={showBulkStockModal}
        onClose={() => setShowBulkStockModal(false)}
        warehouseOptions={warehouseOptions}
        allCombinations={allCombinations}
        existingStocks={allStocks}
        isLoading={variantOptionsResults.isLoading}
        onCreate={handleBulkCreateStocks}
        isCreating={createBulkStocksMutation.isPending}
      />

      <ConfirmModal
        open={!!deleteStockModal}
        onClose={() => setDeleteStockModal(null)}
        onConfirm={() => {
          if (deleteStockModal) {
            deleteStockMutation.mutate(deleteStockModal.id)
            setDeleteStockModal(null)
          }
        }}
        title="Delete Stock"
        description="Are you sure you want to delete this variant stock entry?"
        confirmText="Delete"
        variant="danger"
        isLoading={deleteStockMutation.isPending}
      />

      <StockDowntimeModal
        open={downtimeModalOpen}
        onClose={() => {
          setDowntimeModalOpen(false)
          setSelectedStockId(null)
        }}
        variantStockId={selectedStockId}
      />
    </div>
  )
}

export default ProductVariantStocksSection
