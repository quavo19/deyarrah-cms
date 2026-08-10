import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productService } from '@/services/product.service'

export const useVariantCombinations = (productId, bookableType, variants) => {
  // Create a stable key based on variant IDs to ensure proper cache invalidation
  const variantIdsKey = variants.map(v => v.id).sort().join(',')

  const variantOptionsResults = useQuery({
    queryKey: ['variant-options-batch', productId, variantIdsKey],
    queryFn: async () => {
      if (variants.length === 0) return []
      const results = await Promise.all(
        variants.map(variant => 
          productService.getVariantOptions(variant.id).catch(() => ({ data: [] }))
        )
      )
      return results.map((result, index) => ({
        variantId: variants[index]?.id,
        variantName: variants[index]?.attributes?.name,
        options: result.data || []
      }))
    },
    enabled: !!productId && bookableType === 'bulk' && variants.length > 0,
  })

  const variantOptionsData = useMemo(() => variantOptionsResults.data || [], [variantOptionsResults.data])

  const allCombinations = useMemo(() => {
    if (bookableType !== 'bulk' || variantOptionsData.length === 0) return []

    // Filter out variants with no options - they can't generate combinations
    const optionArrays = variantOptionsData
      .map(v => ({
        variantName: v.variantName,
        variantId: v.variantId,
        options: v.options || []
      }))
      .filter(v => v.options.length > 0) // Only include variants with options
    
    // If no variants have options, return empty array
    if (optionArrays.length === 0) return []
    
    const generateCombinations = (arrays, index = 0, current = []) => {
      if (index === arrays.length) {
        // Only return combination if we have at least one option
        return current.length > 0 ? [current] : []
      }
      
      const combinations = []
      const currentArray = arrays[index]
      
      // If this array has no options, skip it and continue
      if (!currentArray.options || currentArray.options.length === 0) {
        return generateCombinations(arrays, index + 1, current)
      }
      
      for (const option of currentArray.options) {
        combinations.push(...generateCombinations(arrays, index + 1, [...current, { option, variantName: currentArray.variantName }]))
      }
      return combinations
    }

    const combinations = generateCombinations(optionArrays)
    
    return combinations.map(combination => ({
      option_ids: combination.map(item => item.option.id),
      options: combination.map(item => ({
        id: item.option.id,
        name: item.option.attributes?.name || item.option.name,
        variant_type_id: item.option.attributes?.variant_type_id || item.option.variant_type_id,
        variant_type_name: item.variantName || item.option.attributes?.variant_type_name || item.option.variant_type_name,
      }))
    }))
  }, [variantOptionsData, bookableType])

  return {
    variantOptionsResults,
    allCombinations
  }
}

export const useMissingCombinations = (allCombinations, stocks, bookableType) => {
  const missingCombinations = useMemo(() => {
    if (bookableType !== 'bulk' || allCombinations.length === 0) return []

    const getComboKey = (optionIds) => {
      if (!optionIds || optionIds.length === 0) return '[]'
      return JSON.stringify([...optionIds].map(id => String(id)).sort((a, b) => {
        const numA = Number(a)
        const numB = Number(b)
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB
        }
        return a.localeCompare(b)
      }))
    }

    const existingStockKeys = new Set(
      stocks
        .filter(stock => {
          const optionIds = stock.attributes?.option_ids || []
          return optionIds.length > 0
        })
        .map(stock => {
          const optionIds = stock.attributes?.option_ids || []
          return getComboKey(optionIds)
        })
    )

    return allCombinations.filter(combo => {
      if (!combo.option_ids || combo.option_ids.length === 0) return false
      const comboKey = getComboKey(combo.option_ids)
      return !existingStockKeys.has(comboKey)
    })
  }, [allCombinations, stocks, bookableType])

  return missingCombinations
}
