import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { productService } from '@/services/product.service'

export const useStockMutations = (productId) => {
  const toast = useToast()
  const queryClient = useQueryClient()

  const createStockMutation = useMutation({
    mutationFn: (data) => productService.createVariantStock(data, productId),
    onSuccess: () => {
      toast.success('Stock Created', 'Variant stock has been created successfully')
      queryClient.invalidateQueries({ queryKey: ['variant-stocks', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to create stock'
      toast.error('Creation Failed', errorMessage)
    },
  })

  const createBulkStocksMutation = useMutation({
    mutationFn: async (stocksToCreate) => {
      const results = await Promise.all(
        stocksToCreate.map(stock => 
          productService.createVariantStock(stock, productId).catch(err => ({ error: err }))
        )
      )
      return results
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => !r.error).length
      const errorCount = results.filter(r => r.error).length
      if (successCount > 0) {
        toast.success('Stocks Created', `${successCount} stock${successCount > 1 ? 's' : ''} created successfully`)
      }
      if (errorCount > 0) {
        toast.error('Some Failed', `${errorCount} stock${errorCount > 1 ? 's' : ''} failed to create`)
      }
      queryClient.invalidateQueries({ queryKey: ['variant-stocks', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to create stocks'
      toast.error('Creation Failed', errorMessage)
    },
  })

  const updateStockMutation = useMutation({
    mutationFn: ({ stockId, data }) => productService.updateVariantStock(stockId, data, productId),
    onSuccess: () => {
      toast.success('Stock Updated', 'Variant stock has been updated successfully')
      queryClient.invalidateQueries({ queryKey: ['variant-stocks', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to update stock'
      toast.error('Update Failed', errorMessage)
    },
  })

  const deleteStockMutation = useMutation({
    mutationFn: (stockId) => productService.deleteVariantStock(stockId, productId),
    onSuccess: () => {
      toast.success('Stock Deleted', 'Variant stock has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['variant-stocks', productId] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete stock'
      toast.error('Deletion Failed', errorMessage)
    },
  })

  return {
    createStockMutation,
    createBulkStocksMutation,
    updateStockMutation,
    deleteStockMutation
  }
}
