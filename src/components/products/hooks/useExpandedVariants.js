import { useState, useMemo } from 'react'

export const useExpandedVariants = (bookableType, variants) => {
  const baseVariantId = useMemo(() => {
    if (bookableType === 'unit' && variants.length > 0) {
      const baseVariant = variants.find(v => 
        v.attributes?.name === 'Base' || v.attributes?.pricing_role === 'base'
      )
      return baseVariant?.id || null
    }
    return null
  }, [bookableType, variants])

  const initialExpanded = useMemo(() => {
    return baseVariantId ? new Set([baseVariantId]) : new Set()
  }, [baseVariantId])

  const [userExpanded, setUserExpanded] = useState(() => new Set())

  const expandedVariants = useMemo(() => {
    const combined = new Set(initialExpanded)
    userExpanded.forEach(id => combined.add(id))
    return combined
  }, [initialExpanded, userExpanded])

  const toggleVariant = (variantId) => {
    setUserExpanded(prev => {
      const newSet = new Set(prev)
      if (newSet.has(variantId)) {
        newSet.delete(variantId)
      } else {
        newSet.add(variantId)
      }
      return newSet
    })
  }

  return [expandedVariants, toggleVariant]
}
